
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, MoreVertical, Paperclip, Smile, Image as ImageIcon, Mic, Trash2, X } from 'lucide-react';
import { AppConfig } from '../types';
import { generateGeminiResponse } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';
import { API_URL } from '../services/config';

interface ChatInterfaceProps {
  config: AppConfig;
}

// Extend Message type to support audioUrl and imageUrl UI properties without polluting global types
interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    content: string;
    timestamp: Date;
    audioUrl?: string;
    imageUrl?: string;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String.split(',')[1]); 
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ config }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      content: 'Hello! I am your AI assistant powered by Gemini 2.5. You can send me text, voice, or image messages to test the RAG engine.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  
  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Image Upload State
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isRecording, previewUrl]);

  // BEST PRACTICE: Cleanup streams on unmount
  useEffect(() => {
      return () => {
          if (timerRef.current) clearInterval(timerRef.current);
          if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
              mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
          }
      };
  }, []);

  // --- AUDIO LOGIC ---
  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        mediaRecorder.start();
        setIsRecording(true);
        setRecordingDuration(0);
        timerRef.current = setInterval(() => {
            setRecordingDuration(prev => prev + 1);
        }, 1000);

    } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("Microphone access denied.");
    }
  };

  const cancelRecording = () => {
      if (mediaRecorderRef.current) {
          mediaRecorderRef.current.stop();
          // Stop all tracks to release hardware
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      audioChunksRef.current = [];
  };

  const stopAndSendAudio = async () => {
      if (!mediaRecorderRef.current) return;

      // 1. Stop Recorder
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);

      await new Promise(resolve => setTimeout(resolve, 200)); // Wait for onstop

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(audioBlob);

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: '🎤 [Voice Message]',
        timestamp: new Date(),
        audioUrl: audioUrl 
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
          const base64Audio = await blobToBase64(audioBlob);
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;

          const response = await fetch(`${API_URL}/api/chat`, {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}` // Secure Auth
              },
              body: JSON.stringify({ 
                  message: '',
                  audio: base64Audio,
                  mimeType: 'audio/webm'
              })
          });

          const data = await response.json();

          if (!response.ok) {
             throw new Error(data.error || 'Backend error');
          }
          
          const aiMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              role: 'model',
              content: data.response,
              timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMessage]);

      } catch (error: any) {
          console.error("Audio send failed", error);
          let errorMsg = "Error processing audio message.";
          if (error.message.includes('API Key')) errorMsg = "⚠️ Configuration Error: Invalid Gemini API Key. Please update it in Settings.";
          
          const errorMessage: ChatMessage = {
              id: Date.now().toString(),
              role: 'model',
              content: errorMsg,
              timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
      } finally {
          setIsLoading(false);
      }
  };

  // --- IMAGE LOGIC ---
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setSelectedImage(file);
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
          // Reset value to allow re-selecting same file if needed
          e.target.value = '';
      }
  };

  const removeImage = () => {
      setSelectedImage(null);
      setPreviewUrl(null);
  };

  // --- TEXT & IMAGE SEND LOGIC ---
  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const currentInput = input;
    const currentImage = selectedImage;
    const currentPreviewUrl = previewUrl;

    // Reset Input State immediately for UX
    setInput('');
    setSelectedImage(null);
    setPreviewUrl(null);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentInput,
      timestamp: new Date(),
      imageUrl: currentPreviewUrl || undefined
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      let responseText = "";
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      let bodyPayload: any = { message: currentInput };

      // Handle Image Payload
      if (currentImage) {
          const base64Image = await blobToBase64(currentImage);
          bodyPayload = {
              message: currentInput, // Can be empty caption
              image: base64Image,
              mimeType: currentImage.type
          };
      }

      try {
          const response = await fetch(`${API_URL}/api/chat`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Secure Auth
            },
            body: JSON.stringify(bodyPayload)
          });
          
          const data = await response.json();
          
          if (!response.ok) {
             throw new Error(data.error || 'Backend error');
          }
          
          responseText = data.response;
          setIsOfflineMode(false);
      } catch (backendError: any) {
          console.warn("Backend Error:", backendError.message);
          
          // Specific handling for API Key error
          if (backendError.message && (backendError.message.includes('API Key') || backendError.message.includes('Invalid API Key'))) {
              throw new Error("⚠️ Critical: The Gemini API Key is missing or invalid. Please go to Settings and configure it.");
          }

          setIsOfflineMode(true);
          // Fallback only supports text for now in demo mode
          if (config.geminiApiKey && !currentImage) {
             responseText = await generateGeminiResponse(
                 config.geminiApiKey, 
                 userMessage.content, 
                 config.systemInstruction
             );
          } else {
             // If we can't fallback locally (no key in frontend config)
             throw new Error("Server unreachable and no local API Key configured.");
          }
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: error.message || "Error generating response.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-md border border-slate-300 shadow-sm overflow-hidden animate-fade-in">
      
      {/* Sidebar - Desktop Only */}
      <div className="w-64 border-r border-slate-200 bg-slate-50 flex flex-col hidden md:flex">
          <div className="p-4 border-b border-slate-200 font-bold text-slate-700 text-sm flex justify-between">
              <span>Active Conversations</span>
              <span className="bg-indigo-100 text-indigo-700 px-1.5 rounded text-xs">1</span>
          </div>
          <div className="p-2">
              <div className="bg-white border border-slate-200 rounded p-3 shadow-sm cursor-pointer border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-slate-800 text-sm">Preview User</span>
                      <span className="text-[10px] text-slate-400">Now</span>
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                      {messages[messages.length-1].content || (messages[messages.length-1].imageUrl ? '[Image]' : '[Audio]')}
                  </div>
              </div>
          </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        <div className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-white z-10">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-white">
                    <Bot className="w-4 h-4" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-sm">Assistant (Gemini 2.5)</h3>
                    <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isOfflineMode ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                        <span className="text-xs text-slate-500">{isOfflineMode ? 'Browser Mode' : 'Online'}</span>
                    </div>
                </div>
            </div>
            <button className="text-slate-400 hover:text-slate-600"><MoreVertical className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div className={`flex flex-col max-w-[70%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`px-4 py-3 rounded-md text-sm shadow-sm border relative ${
                            msg.role === 'user' 
                            ? 'bg-indigo-600 text-white border-indigo-700 rounded-br-none' 
                            : 'bg-white text-slate-700 border-slate-200 rounded-bl-none'
                        }`}>
                            {msg.imageUrl && (
                                <div className="mb-2">
                                    <img src={msg.imageUrl} alt="Uploaded" className="rounded-md max-h-48 object-cover border border-white/20" />
                                </div>
                            )}
                            {msg.content && <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>}
                            {msg.audioUrl && (
                                <div className="mt-2 bg-indigo-700/50 rounded p-2 flex items-center gap-2">
                                    <audio controls src={msg.audioUrl} className="h-8 w-48" />
                                </div>
                            )}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1 flex items-center gap-1">
                            {msg.role === 'user' && <User className="w-3 h-3" />}
                            {msg.role === 'model' && <Sparkles className="w-3 h-3" />}
                            {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                </div>
            ))}
            
            {isLoading && (
                <div className="flex justify-start animate-fade-in">
                    <div className="bg-white border border-slate-200 px-4 py-3 rounded-md rounded-bl-none shadow-sm flex items-center gap-2">
                        <div className="flex space-x-1 h-3 items-center p-1">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse-dot"></div>
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse-dot delay-150"></div>
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse-dot delay-300"></div>
                        </div>
                        <span className="text-xs text-slate-500 font-medium ml-1">Analyzing content...</span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200 relative">
            
            {/* Image Preview Banner */}
            {previewUrl && !isRecording && (
                <div className="absolute bottom-full left-4 mb-2 z-20 animate-fade-in">
                    <div className="relative group inline-block">
                        <img src={previewUrl} alt="Preview" className="h-20 w-auto rounded-md shadow-md border border-slate-300 bg-white" />
                        <button 
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {isRecording ? (
                <div className="absolute inset-0 z-20 bg-slate-50 flex items-center justify-between px-6 border-t border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <div className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></div>
                        </div>
                        <span className="text-slate-700 font-mono font-bold">{formatTime(recordingDuration)}</span>
                        <span className="text-slate-400 text-xs ml-2">Recording...</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={cancelRecording}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={stopAndSendAudio}
                            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors shadow-md"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="border border-slate-300 rounded-md shadow-sm focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 bg-white transition-all">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={selectedImage ? "Add a caption..." : "Type a message or record audio..."}
                        className="w-full p-3 max-h-32 min-h-[50px] resize-none border-none focus:ring-0 text-sm text-slate-800 placeholder:text-slate-400"
                        disabled={isLoading}
                    />
                    <div className="flex items-center justify-between px-2 py-2 bg-slate-50 border-t border-slate-100 rounded-b-md">
                        <div className="flex items-center gap-1">
                            {/* Hidden File Input */}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleImageSelect} 
                                accept="image/*" 
                                className="hidden" 
                            />
                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition-colors"><Paperclip className="w-4 h-4" /></button>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className={`p-2 rounded transition-colors ${selectedImage ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'}`}
                            >
                                <ImageIcon className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition-colors"><Smile className="w-4 h-4" /></button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                             {!input.trim() && !selectedImage && (
                                <button
                                    onClick={startRecording}
                                    disabled={isLoading}
                                    className="p-2 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                >
                                    <Mic className="w-5 h-5" />
                                </button>
                             )}

                            <button
                                onClick={handleSend}
                                disabled={(!input.trim() && !selectedImage) || isLoading}
                                className={`px-4 py-1.5 rounded text-sm font-bold transition-all flex items-center gap-2 ${
                                    (!input.trim() && !selectedImage) || isLoading
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed hidden'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                                }`}
                            >
                                <span>Send</span>
                                <Send className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="text-center mt-2 flex justify-center items-center gap-2">
                <p className="text-[10px] text-slate-400">Gemini 2.5 Flash • RAG Enabled • Multimodal</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
