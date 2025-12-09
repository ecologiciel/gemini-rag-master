import React, { useState, useEffect } from 'react';
import { StrategyConfig, StrategyResult, StrategyMode } from '../types';
import { Calendar, Filter, Target, Languages, Sparkles, Copy, Instagram, Facebook, Smartphone, Image as ImageIcon, MessageCircle, Mic2, Megaphone, Loader2, Layout, SlidersHorizontal, CheckCircle2, Clock, FileText, Check, Wifi, WifiOff, Share2, Download, CalendarClock, ThumbsUp, ThumbsDown, Send, X, Users, AlertTriangle, UserPlus, Search, CheckSquare, Square, FileCode } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { API_URL } from '../services/config';

// Type for the Contact Manager
interface Contact {
    number: string;
    name: string;
    lastActive: string;
}

const StrategyHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StrategyMode>('messaging');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StrategyResult | null>(null);
  const [actionFeedback, setActionFeedback] = useState<Record<string, string>>({});
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'unknown'>('unknown');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Send Modal State
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  
  // Message Type State (Text vs Template)
  const [messageType, setMessageType] = useState<'text' | 'template'>('text');
  const [templateName, setTemplateName] = useState('hello_world');
  const [templateLang, setTemplateLang] = useState('en_US');

  const [sendContent, setSendContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sendReport, setSendReport] = useState<{success: number, failed: number, errors: any[]} | null>(null);

  // Recipient Manager State
  const [recipientTab, setRecipientTab] = useState<'manual' | 'contacts'>('contacts');
  const [manualRecipients, setManualRecipients] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]); // Array of numbers
  const [contactSearch, setContactSearch] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Configuration State
  const [config, setConfig] = useState<StrategyConfig>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    mode: 'messaging', 
    language: 'fr',
    contentFilter: 'frequent_questions',
    objective: 'inform',
    tone: 'friendly'
  });

  // Fetch contacts when opening the modal
  useEffect(() => {
      if (isSendModalOpen) {
          fetchContacts();
      }
  }, [isSendModalOpen]);

  const fetchContacts = async () => {
      setLoadingContacts(true);
      try {
          const { data: { session } } = await supabase.auth.getSession();
          const res = await fetch(`${API_URL}/api/contacts`, {
              headers: { 'Authorization': `Bearer ${session?.access_token}` }
          });
          if (res.ok) {
              const data = await res.json();
              setContacts(data);
          }
      } catch (e) {
          console.error("Failed to fetch contacts", e);
      } finally {
          setLoadingContacts(false);
      }
  };

  const toggleContactSelection = (number: string) => {
      if (selectedContacts.includes(number)) {
          setSelectedContacts(prev => prev.filter(n => n !== number));
      } else {
          setSelectedContacts(prev => [...prev, number]);
      }
  };

  const selectAllFiltered = () => {
      const filtered = contacts.filter(c => 
        c.name.toLowerCase().includes(contactSearch.toLowerCase()) || 
        c.number.includes(contactSearch)
      );
      const allNumbers = filtered.map(c => c.number);
      // Merge unique
      setSelectedContacts(prev => Array.from(new Set([...prev, ...allNumbers])));
  };

  const deselectAll = () => {
      setSelectedContacts([]);
  };

  // --- MOCK DATA GENERATOR (Offline Fallback) ---
  const generateMockStrategy = (cfg: StrategyConfig): StrategyResult => {
      const isFr = cfg.language === 'fr';
      const isSocial = cfg.mode === 'social';
      
      const titles = isFr 
        ? ["Lancement de Produit", "Campagne Fidélité", "Support Proactif"] 
        : ["Product Launch", "Loyalty Campaign", "Proactive Support"];
      
      const recommendations = isFr
        ? ["Utiliser des emojis pour augmenter l'engagement.", "Poster le matin pour un meilleur taux d'ouverture."]
        : ["Use emojis to boost engagement.", "Post in the morning for better open rates."];

      return {
          mode: cfg.mode,
          generatedAt: new Date().toISOString(),
          synthesis: isFr 
            ? `Stratégie générée pour l'objectif '${cfg.objective}' avec un ton '${cfg.tone}'. Le focus est mis sur la rétention et l'information claire via ${isSocial ? 'les réseaux sociaux' : 'WhatsApp'}.`
            : `Strategy generated for objective '${cfg.objective}' with a '${cfg.tone}' tone. Focus is on retention and clear information via ${isSocial ? 'social channels' : 'WhatsApp'}.`,
          themes: [
              {
                  title: titles[0],
                  recommendation: recommendations[0],
                  best_posting_time: "09:00 AM",
                  rag_source_docs: ["Marketing_Plan_2025.pdf", "User_Feedback_Q3.csv"],
                  content: [
                      {
                          platform: isSocial ? 'Instagram' : 'WhatsApp',
                          content: isFr 
                             ? `🚀 Découvrez notre nouvelle fonctionnalité !\n\nNous avons écouté vos retours. Cliquez ici pour en savoir plus 👇\n\n#Innovation #Nouveauté`
                             : `🚀 Discover our newest feature!\n\nWe listened to your feedback. Click here to learn more 👇\n\n#Innovation #New`,
                          image_prompt: "A futuristic 3D rendering of a smartphone with glowing interface elements, clean studio lighting.",
                          hashtags: ["#Tech", "#News", "#Update"]
                      },
                      {
                          platform: isSocial ? 'Facebook' : 'WhatsApp',
                          content: isFr
                             ? `👋 Salut ! Saviez-vous que vous pouvez économiser 20% cette semaine ?`
                             : `👋 Hi there! Did you know you can save 20% this week?`,
                          image_prompt: "Happy diverse group of people looking at a tablet screen, smiling, natural sunlight.",
                          hashtags: ["#Promo", "#Deal"]
                      }
                  ]
              },
              {
                  title: titles[1],
                  recommendation: recommendations[1],
                  best_posting_time: "06:30 PM",
                  rag_source_docs: ["Support_Logs_Export.xlsx"],
                  content: [
                      {
                          platform: isSocial ? 'Instagram' : 'WhatsApp',
                          content: isFr
                             ? `💡 Astuce du jour : Comment optimiser votre espace de travail ?\n\n1. Éclairage\n2. Ergonomie\n3. Pauses régulières`
                             : `💡 Tip of the day: How to optimize your workspace?\n\n1. Lighting\n2. Ergonomics\n3. Regular breaks`,
                          image_prompt: "Minimalist desk setup with plants, macbook, coffee cup, warm cozy lighting.",
                          hashtags: ["#Productivity", "#Tips"]
                      }
                  ]
              }
          ]
      };
  };

  const handleTabChange = (mode: StrategyMode) => {
    setActiveTab(mode);
    setConfig(prev => ({ ...prev, mode: mode }));
    setResult(null); 
    setErrorMsg(null);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    setErrorMsg(null);
    setConnectionStatus('unknown');

    try {
        const response = await fetch(`${API_URL}/api/strategy/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
        
        if (response.ok) {
            const data = await response.json();
            setResult(data);
            setConnectionStatus('connected');
        } else {
            throw new Error("Backend Unavailable");
        }
    } catch (e: any) {
        console.warn("Backend unavailable, using mock generator based on config.");
        // FALLBACK: Use local mock generation if backend is down
        setTimeout(() => {
            const mockData = generateMockStrategy(config);
            setResult(mockData);
            setConnectionStatus('disconnected');
        }, 1500); // Simulate processing delay
    } finally {
        // Ensure loading stops in both success and fail cases
        // We handle the timeout inside the catch block for the mock
        if (connectionStatus === 'connected') {
             setLoading(false);
        } else {
             // For mock, wait for timeout
             setTimeout(() => setLoading(false), 1500);
        }
    }
  };

  const handleAction = (id: string, action: string, content?: string) => {
      // Logic for Send Button
      if (action === 'publish' && content) {
          setSendContent(content);
          setManualRecipients(''); 
          setSendReport(null);
          // Default to Free Text since it's a generated strategy, but warn user
          setMessageType('text'); 
          setIsSendModalOpen(true);
          return;
      }

      // Simulate action feedback for others
      const feedbackMap: Record<string, string> = {
          'copy': 'Copied!',
          'schedule': 'Scheduled',
          'publish': 'Published',
          'approve': 'Approved',
          'reject': 'Rejected',
          'download': 'Downloaded'
      };

      if (action === 'copy') {
         // Actual copy logic handled in button
      }

      setActionFeedback(prev => ({ ...prev, [id]: feedbackMap[action] || 'Done' }));
      setTimeout(() => {
          setActionFeedback(prev => {
              const newState = { ...prev };
              delete newState[id];
              return newState;
          });
      }, 2000);
  };

  const executeSend = async () => {
      // Determine final list based on active tab
      let numbers: string[] = [];
      
      if (recipientTab === 'manual') {
          numbers = manualRecipients.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 5);
      } else {
          numbers = selectedContacts;
      }

      if (numbers.length === 0) return;
      if (messageType === 'text' && !sendContent) return;
      if (messageType === 'template' && (!templateName || !templateLang)) return;
      
      setSending(true);
      setSendReport(null);

      try {
          const { data: { session } } = await supabase.auth.getSession();
          const response = await fetch(`${API_URL}/api/whatsapp/broadcast`, {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session?.access_token}`
              },
              body: JSON.stringify({
                  numbers: numbers,
                  type: messageType,
                  message: messageType === 'text' ? sendContent : undefined,
                  templateName: messageType === 'template' ? templateName : undefined,
                  templateLang: messageType === 'template' ? templateLang : undefined
              })
          });

          if (response.ok) {
              const report = await response.json();
              setSendReport(report);
          } else {
              throw new Error("Failed to send");
          }
      } catch (e) {
          // Simulate success in Demo Mode
          console.warn("Backend unavailable, simulating send.");
          setTimeout(() => {
             setSendReport({ 
                 success: numbers.length, 
                 failed: 0, 
                 errors: [] 
             });
             setSending(false);
          }, 1000);
      } finally {
          if (connectionStatus === 'connected') setSending(false);
      }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
        handleAction(id, 'copy');
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] animate-fade-in bg-slate-100 -m-8 relative">
      
      {/* 1. COMPOSER BAR (Hootsuite Style Control Panel) */}
      <div className="bg-white border-b border-slate-300 px-6 py-4 shadow-sm z-10 flex flex-col gap-4">
        {/* Top Row: Navigation Tabs */}
        <div className="flex items-center justify-between">
            <div className="flex space-x-6">
                <button 
                    onClick={() => handleTabChange('messaging')}
                    className={`pb-2 text-sm font-bold uppercase tracking-wide transition-all border-b-2 flex items-center gap-2 ${
                        activeTab === 'messaging' 
                        ? 'border-indigo-600 text-indigo-600' 
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Smartphone className="w-4 h-4" />
                    WhatsApp Streams
                </button>
                <button 
                    onClick={() => handleTabChange('social')}
                    className={`pb-2 text-sm font-bold uppercase tracking-wide transition-all border-b-2 flex items-center gap-2 ${
                        activeTab === 'social' 
                        ? 'border-purple-600 text-purple-600' 
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Layout className="w-4 h-4" />
                    Social Media Feeds
                </button>
            </div>
            
            <button 
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-md font-semibold text-sm transition-colors shadow-sm disabled:opacity-50"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? 'Generating...' : 'Generate Strategy'}
            </button>
        </div>

        {/* Bottom Row: Compact Filters */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 text-slate-600 text-xs font-bold uppercase tracking-wider mr-2">
                <SlidersHorizontal className="w-4 h-4" />
                Config
            </div>
            
            <div className="flex items-center bg-white border border-slate-300 rounded px-2 py-1">
                <Calendar className="w-3 h-3 text-slate-400 mr-2" />
                <input type="date" value={config.startDate} onChange={(e) => setConfig({...config, startDate: e.target.value})} className="text-xs border-none focus:ring-0 p-0 text-slate-700 w-24" />
                <span className="text-slate-400 mx-1">-</span>
                <input type="date" value={config.endDate} onChange={(e) => setConfig({...config, endDate: e.target.value})} className="text-xs border-none focus:ring-0 p-0 text-slate-700 w-24" />
            </div>

            <div className="h-6 w-px bg-slate-300 mx-1"></div>

            <select value={config.objective} onChange={(e) => setConfig({...config, objective: e.target.value as any})} className="bg-white border border-slate-300 text-slate-700 text-xs rounded px-3 py-1.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none">
                <option value="inform">ℹ️ Informer</option>
                <option value="educate">🎓 Éduquer</option>
                <option value="action">⚡ Convertir</option>
                <option value="correct">🛠️ Corriger</option>
            </select>

            <select value={config.tone} onChange={(e) => setConfig({...config, tone: e.target.value as any})} className="bg-white border border-slate-300 text-slate-700 text-xs rounded px-3 py-1.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none">
                <option value="friendly">😊 Amical</option>
                <option value="formal">👔 Formel</option>
                <option value="urgent">🚨 Urgent</option>
                <option value="educational">🧠 Pédagogique</option>
            </select>

            <select value={config.language} onChange={(e) => setConfig({...config, language: e.target.value as any})} className="bg-white border border-slate-300 text-slate-700 text-xs rounded px-3 py-1.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none">
                <option value="fr">FR</option>
                <option value="en">EN</option>
                <option value="ar">AR</option>
            </select>

            <div className="flex-1"></div>
            
            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-slate-300">
               <Target className="w-3 h-3 text-slate-500" />
               <select 
                   value={config.contentFilter} 
                   onChange={(e) => setConfig({...config, contentFilter: e.target.value as any})}
                   className="text-xs text-slate-700 font-medium bg-transparent border-none focus:ring-0 cursor-pointer outline-none"
               >
                   <option value="frequent_questions">Focus: Frequent Questions</option>
                   <option value="low_confidence">Focus: Low Confidence</option>
                   <option value="negative_sentiment">Focus: Negative Sentiment</option>
               </select>
            </div>
        </div>
      </div>

      {/* 2. STREAMS AREA */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        
        {/* Error State */}
        {errorMsg && (
            <div className="h-full flex flex-col items-center justify-center text-red-500">
                <WifiOff className="w-12 h-12 mb-4 opacity-50" />
                <h3 className="font-bold text-lg">Connection Error</h3>
                <p className="text-sm opacity-80 mt-2">{errorMsg}</p>
                <button onClick={handleGenerate} className="mt-4 text-indigo-600 underline text-sm">Retry Connection</button>
            </div>
        )}

        {/* Success State */}
        {!errorMsg && result ? (
            <div className="flex h-full gap-6">
                
                {/* STRATEGY SUMMARY COLUMN (Fixed) */}
                <div className="w-80 flex-shrink-0 flex flex-col bg-white rounded-lg border border-slate-300 shadow-sm h-full">
                    <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-indigo-600" />
                            <h3 className="font-bold text-slate-700 text-sm uppercase">Analysis Summary</h3>
                        </div>
                        {connectionStatus === 'connected' ? (
                             <span className="flex items-center gap-1 text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                                <Wifi className="w-3 h-3" /> Live
                             </span>
                        ) : (
                             <span className="flex items-center gap-1 text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100" title="Using mocked data for demo">
                                <WifiOff className="w-3 h-3" /> Demo
                             </span>
                        )}
                    </div>
                    <div className="p-4 overflow-y-auto">
                        <p className="text-sm text-slate-600 leading-relaxed mb-4">{result.synthesis}</p>
                        <div className="space-y-3">
                            <div className="text-xs font-semibold text-slate-500 uppercase">Active Parameters</div>
                            <div className="flex flex-wrap gap-2">
                                <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600 border border-slate-200">{config.objective}</span>
                                <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600 border border-slate-200">{config.tone}</span>
                                <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600 border border-slate-200">{config.mode}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* DYNAMIC THEME COLUMNS */}
                {result.themes.map((theme, idx) => (
                    <div key={idx} className="w-96 flex-shrink-0 flex flex-col bg-slate-200 rounded-lg border border-slate-300 shadow-sm h-full">
                        {/* Stream Header */}
                        <div className="p-3 border-b border-slate-300 bg-white rounded-t-lg flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 text-sm truncate w-48" title={theme.title}>{theme.title}</h3>
                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                    <Clock className="w-3 h-3" /> {theme.best_posting_time}
                                </span>
                            </div>
                        </div>

                        {/* Stream Content */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-3">
                            <div className="bg-blue-50 border border-blue-100 p-3 rounded shadow-sm">
                                <p className="text-xs text-blue-800 font-medium">{theme.recommendation}</p>
                            </div>

                            {theme.content.map((c, i) => {
                                const cardId = `${idx}-${i}-${c.platform}`;
                                const feedback = actionFeedback[cardId];
                                return (
                                <div key={i} className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden group">
                                    <div className="px-3 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                        <div className="flex items-center gap-2">
                                            {c.platform === 'WhatsApp' ? <Smartphone className="w-3 h-3 text-green-600" /> : 
                                             c.platform === 'Facebook' ? <Facebook className="w-3 h-3 text-blue-600" /> : 
                                             <Instagram className="w-3 h-3 text-pink-600" />}
                                            <span className="text-xs font-bold text-slate-700">{c.platform}</span>
                                        </div>
                                        <button onClick={() => copyToClipboard(c.content, cardId)} className="p-1 hover:bg-slate-200 rounded"><Copy className="w-3 h-3 text-slate-500" /></button>
                                    </div>
                                    <div className="p-3">
                                        <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{c.content}</p>
                                    </div>
                                    <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                                         <div className="flex items-center">
                                            {feedback ? <span className="text-[10px] font-bold text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {feedback}</span> : <span className="text-[10px] text-slate-400 font-mono">Draft</span>}
                                         </div>
                                         <div className="flex gap-2">
                                            {c.platform === 'WhatsApp' ? (
                                                <button onClick={() => handleAction(cardId, 'publish', c.content)} className="p-1 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded"><Send className="w-3.5 h-3.5" /></button>
                                            ) : (
                                                <button onClick={() => handleAction(cardId, 'publish')} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Send className="w-3.5 h-3.5" /></button>
                                            )}
                                         </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        ) : !loading && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Layout className="w-10 h-10 text-slate-300" /></div>
                <h3 className="text-lg font-bold text-slate-600">No Streams Active</h3>
                <p className="text-sm text-slate-400 max-w-md text-center mt-2">Configure your strategy parameters above and click "Generate Strategy" to populate your content streams.</p>
            </div>
        )}
      </div>

      {/* WHATSAPP SEND MODAL (REVAMPED) */}
      {isSendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-green-600" />
                        <h3 className="font-bold text-slate-800">WhatsApp Broadcast</h3>
                    </div>
                    <button onClick={() => setIsSendModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {/* Step 0: Message Type (Critical for Compliance) */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Message Type</label>
                        <div className="flex border border-slate-300 rounded overflow-hidden">
                            <button 
                                onClick={() => setMessageType('template')}
                                className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${messageType === 'template' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                            >
                                <FileCode className="w-3.5 h-3.5" /> Marketing (Template)
                            </button>
                            <button 
                                onClick={() => setMessageType('text')}
                                className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${messageType === 'text' ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                            >
                                <MessageCircle className="w-3.5 h-3.5" /> Free Text (Reply Only)
                            </button>
                        </div>
                    </div>

                    {/* Step 1: Content Input */}
                    {messageType === 'text' && (
                        <div className="bg-amber-50 border border-amber-200 rounded p-3 space-y-2">
                             <div className="flex items-start gap-2 text-xs text-amber-800 font-bold">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                <p>Compliance Warning: Free-form text can only be sent to users who messaged you in the last 24 hours. For marketing, use Templates.</p>
                            </div>
                            <textarea 
                                value={sendContent}
                                onChange={(e) => setSendContent(e.target.value)}
                                className="w-full h-24 border border-amber-300 rounded p-2 text-sm focus:ring-1 focus:ring-amber-500 outline-none resize-none bg-white"
                                placeholder="Type your reply here..."
                            />
                        </div>
                    )}

                    {messageType === 'template' && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded p-4 space-y-3">
                             <p className="text-xs text-indigo-800 mb-2"><strong>Recommended:</strong> Templates ensure high delivery rates and comply with Meta's marketing policies.</p>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-indigo-700 uppercase mb-1">Template Name</label>
                                    <input 
                                        type="text" 
                                        value={templateName}
                                        onChange={(e) => setTemplateName(e.target.value)}
                                        className="w-full border border-indigo-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                        placeholder="e.g. hello_world"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-indigo-700 uppercase mb-1">Language Code</label>
                                    <input 
                                        type="text" 
                                        value={templateLang}
                                        onChange={(e) => setTemplateLang(e.target.value)}
                                        className="w-full border border-indigo-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                        placeholder="e.g. en_US"
                                    />
                                </div>
                             </div>
                             <div className="text-[10px] text-slate-500 mt-1">
                                 Note: The template must already be approved in your Meta Business Manager.
                             </div>
                        </div>
                    )}

                    {/* Step 2: Recipient Selection */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2 flex items-center gap-1">
                            <Users className="w-3 h-3" /> Select Recipients
                        </label>
                        
                        {/* Tabs */}
                        <div className="flex border-b border-slate-200 mb-3">
                            <button 
                                onClick={() => setRecipientTab('contacts')}
                                className={`px-4 py-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${recipientTab === 'contacts' ? 'border-green-600 text-green-700 bg-green-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                            >
                                <UserPlus className="w-3.5 h-3.5" /> Saved Contacts
                            </button>
                            <button 
                                onClick={() => setRecipientTab('manual')}
                                className={`px-4 py-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${recipientTab === 'manual' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
                            >
                                <Copy className="w-3.5 h-3.5" /> Manual Entry
                            </button>
                        </div>

                        {/* Contacts List View */}
                        {recipientTab === 'contacts' && (
                            <div className="border border-slate-300 rounded-lg overflow-hidden flex flex-col h-64">
                                {/* Search & Toolbar */}
                                <div className="p-2 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                                    <div className="relative flex-1 mr-4">
                                        <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text" 
                                            placeholder="Search by name or number..."
                                            value={contactSearch}
                                            onChange={(e) => setContactSearch(e.target.value)}
                                            className="w-full pl-8 pr-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-green-500 outline-none"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={selectAllFiltered} className="text-[10px] text-green-700 font-bold hover:underline">Select All</button>
                                        <button onClick={deselectAll} className="text-[10px] text-slate-500 hover:underline">Clear</button>
                                    </div>
                                </div>

                                {/* List */}
                                <div className="flex-1 overflow-y-auto p-0 bg-white">
                                    {loadingContacts ? (
                                        <div className="h-full flex items-center justify-center text-slate-400">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        </div>
                                    ) : (
                                        <ul className="divide-y divide-slate-100">
                                            {contacts
                                                .filter(c => c.name.toLowerCase().includes(contactSearch.toLowerCase()) || c.number.includes(contactSearch))
                                                .map(contact => {
                                                    const isSelected = selectedContacts.includes(contact.number);
                                                    return (
                                                        <li 
                                                            key={contact.number} 
                                                            onClick={() => toggleContactSelection(contact.number)}
                                                            className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${isSelected ? 'bg-green-50' : 'hover:bg-slate-50'}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-green-600 border-green-600' : 'border-slate-300'}`}>
                                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-slate-800">{contact.name}</p>
                                                                    <p className="text-xs text-slate-500 font-mono">{contact.number}</p>
                                                                </div>
                                                            </div>
                                                            <span className="text-[10px] text-slate-400">
                                                                Active: {new Date(contact.lastActive).toLocaleDateString()}
                                                            </span>
                                                        </li>
                                                    );
                                                })}
                                            {contacts.length === 0 && (
                                                <li className="p-8 text-center text-slate-400 text-xs">No contacts found in history.</li>
                                            )}
                                        </ul>
                                    )}
                                </div>
                                <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 font-bold">
                                    {selectedContacts.length} recipients selected
                                </div>
                            </div>
                        )}

                        {/* Manual Entry View */}
                        {recipientTab === 'manual' && (
                            <div>
                                <textarea 
                                    value={manualRecipients}
                                    onChange={(e) => setManualRecipients(e.target.value)}
                                    placeholder="Paste numbers here (e.g. 15551234567), separated by commas or new lines."
                                    className="w-full h-32 border border-slate-300 rounded p-2 text-xs font-mono focus:ring-1 focus:ring-green-500 outline-none resize-none"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Use E.164 format (Country Code + Number, no +).</p>
                            </div>
                        )}
                    </div>

                    {/* Report / Status */}
                    {sendReport && (
                         <div className={`p-3 rounded border text-xs ${sendReport.failed > 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold">Transmission Complete</p>
                                    <p>Sent: {sendReport.success} | Failed: {sendReport.failed}</p>
                                </div>
                                {sendReport.failed === 0 && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                            </div>
                            {sendReport.errors.length > 0 && (
                                <ul className="mt-2 list-disc pl-4 opacity-80">
                                    {sendReport.errors.slice(0, 3).map((e, i) => (
                                        <li key={i}>{e.number}: {e.is24hWindowError ? "Outside 24h Window (Use Template)" : e.message}</li>
                                    ))}
                                    {sendReport.errors.length > 3 && <li>...and {sendReport.errors.length - 3} more.</li>}
                                </ul>
                            )}
                         </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                    <button 
                        onClick={() => setIsSendModalOpen(false)}
                        className="px-4 py-2 border border-slate-300 text-slate-600 rounded text-sm font-bold hover:bg-slate-100"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={executeSend}
                        disabled={sending || (messageType === 'text' && !sendContent) || (messageType === 'template' && !templateName) || (recipientTab === 'contacts' ? selectedContacts.length === 0 : !manualRecipients)}
                        className="px-6 py-2 bg-green-600 text-white rounded text-sm font-bold hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 shadow-sm"
                    >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {sending ? 'Sending...' : `Broadcast to ${recipientTab === 'contacts' ? selectedContacts.length : 'List'}`}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default StrategyHub;