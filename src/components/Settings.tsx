
import React, { useState, useEffect } from 'react';
import { Save, Lock, Eye, EyeOff, Terminal, Key, Shield, Server, MessageSquare, Megaphone, Smartphone, Facebook, Sparkles, RefreshCw } from 'lucide-react';
import { AppConfig } from '../types';
import { supabase } from '../services/supabaseClient';
import { API_URL } from '../services/config';

interface SettingsProps {
  config: AppConfig;
  onUpdateConfig: (newConfig: AppConfig) => void;
}

const MINISTRY_PROMPT = `RÔLE : Assistant Numérique Officiel du Ministère de la Solidarité, de l'Insertion Sociale et de la Famille.

OBJECTIF PRINCIPAL :
Faciliter l'accès à l'information sociale et orienter les citoyens vers les procédures administratives adéquates en se basant exclusivement sur la documentation officielle fournie.

PÉRIMÈTRE D'INTERVENTION :
1. Programmes d'appui social et protection sociale (Ciblage, Aides directes).
2. Droits et services pour les personnes en situation de handicap.
3. Promotion des droits des femmes, de la famille et protection de l'enfance.
4. Procédures administratives (critères d'éligibilité, pièces requises, lieux de dépôt).

DIRECTIVES DE COMPORTEMENT (DO's) :
- GROUNDING STRICT (ANCRAGE) : Vos réponses doivent être impérativement fondées sur le "Contexte RAG" (documents) fourni. Citez vos sources si possible.
- NEUTRALITÉ & EMPATHIE : Adoptez un ton institutionnel, respectueux, bienveillant mais objectif. Vous représentez l'administration publique.
- ADAPTABILITÉ LINGUISTIQUE : Détectez la langue de l'utilisateur et répondez strictement dans la même langue (Arabe standard, Darija marocaine, Français, Tamazight).
- CLARTÉ PÉDAGOGIQUE : Vulgarisez le jargon administratif. Utilisez des listes à puces pour expliquer les démarches étape par étape.
- URGENCE SOCIALE : En cas de détection de détresse extrême ou de violence, priorisez l'orientation vers les numéros d'urgence nationaux avant toute autre réponse.

RESTRICTIONS (DON'Ts) :
- NE PAS HALLUCINER : Ne jamais inventer de procédures, de dates ou de critères d'éligibilité s'ils sont absents de la documentation fournie.
- NE PAS PROMESSES : Ne jamais garantir l'obtention d'une aide (seule l'administration compétente décide).
- NE PAS COLLECTER : Ne jamais demander d'informations sensibles (bancaires, mots de passe) dans le chat.
- NE PAS OPINER : Ne jamais émettre d'avis politiques, religieux ou personnels.

GESTION DE L'INCERTITUDE :
Si l'information demandée ne figure pas explicitement dans le contexte fourni, répondez par la formule standard : "Je ne dispose pas de cette information spécifique dans ma documentation officielle actuelle. Je vous invite à consulter le portail web du Ministère ou à vous rendre à la délégation la plus proche."`;

const Settings: React.FC<SettingsProps> = ({ config, onUpdateConfig }) => {
  // Initialize state with all possible keys to ensure inputs work even if fetch fails
  const [localConfig, setLocalConfig] = useState<AppConfig>({
      geminiApiKey: '',
      
      verifyToken: '',
      fbAppSecret: '',
      
      whatsappToken: '',
      whatsappPhoneNumberId: '',
      
      messengerToken: '',
      instagramToken: '',
      fbPageToken: '',
      
      systemInstruction: '',
      marketingInstruction: '',
      ...config 
  });

  const [activeTab, setActiveTab] = useState<'integrations' | 'agents'>('integrations');
  const [activeAgentTab, setActiveAgentTab] = useState<'rag' | 'marketing'>('rag');
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Load Config from Backend
  useEffect(() => {
    const loadConfig = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if(!session) return;
        
        try {
            const res = await fetch(`${API_URL}/api/config`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                // Merge backend data with current structure to prevent undefined errors
                setLocalConfig(prev => ({
                    ...prev,
                    ...data
                }));
            }
        } catch (e) {
            console.warn("Backend unavailable for config fetch");
        }
    };
    loadConfig();
  }, []);

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // 1. Save to Backend
        if (session) {
            try {
                const response = await fetch(`${API_URL}/api/config`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify(localConfig)
                });
                
                if (response.ok) {
                    setSaveStatus('saved');
                } else {
                    setSaveStatus('error');
                    console.error("Backend failed to save");
                }
            } catch (e) {
                setSaveStatus('error'); // Backend likely down
            }
        } else {
             // Demo mode save
             setSaveStatus('saved'); 
        }

        // 2. Propagate up to App state (Mock or Real)
        onUpdateConfig(localConfig);

    } catch (e) {
        setSaveStatus('error');
    }
    
    // Reset status after delay
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const SecretInput = ({ label, field, placeholder, icon: Icon }: any) => (
      <div className="mb-4">
        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">{label}</label>
        <div className="flex">
            <div className="relative flex-1">
                <Icon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                    type={showKey[field] ? 'text' : 'password'}
                    value={(localConfig as any)[field] || ''}
                    onChange={e => setLocalConfig({...localConfig, [field]: e.target.value})}
                    className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-l-md text-sm focus:ring-1 focus:ring-indigo-500 outline-none font-mono text-slate-600"
                    placeholder={placeholder}
                />
            </div>
            <button 
                onClick={() => setShowKey({...showKey, [field]: !showKey[field]})}
                className="px-4 border border-l-0 border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-r-md text-slate-500"
                tabIndex={-1}
            >
                {showKey[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
        </div>
      </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fade-in">
      
      {/* Header */}
      <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Account & Configuration</h1>
            <p className="text-slate-500 text-sm mt-1">Manage API keys, system prompts, and security settings.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className={`px-6 py-2 rounded-md font-bold text-sm shadow-sm flex items-center gap-2 transition-all ${
                saveStatus === 'saved' ? 'bg-green-600 text-white' : 
                saveStatus === 'error' ? 'bg-red-600 text-white' :
                'bg-slate-800 hover:bg-slate-900 text-white'
            }`}
          >
              <Save className="w-4 h-4" />
              {saveStatus === 'saving' ? 'Saving...' : 
               saveStatus === 'saved' ? 'Saved Successfully' : 
               saveStatus === 'error' ? 'Save Failed' : 
               'Save Configuration'}
          </button>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('integrations')}
            className={`px-6 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'integrations' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
              <Key className="w-4 h-4" /> API Integrations
          </button>
          <button 
            onClick={() => setActiveTab('agents')}
            className={`px-6 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'agents' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
              <Terminal className="w-4 h-4" /> Agent Brains
          </button>
      </div>

      {/* 1. INTEGRATIONS TAB */}
      {activeTab === 'integrations' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Google Gemini */}
            <div className="bg-white rounded-md border border-slate-300 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-slate-700 text-sm uppercase">Google Cloud AI</h3>
                </div>
                <div className="p-6">
                    <SecretInput label="Gemini API Key" field="geminiApiKey" placeholder="AIza..." icon={Lock} />
                </div>
            </div>

            {/* Meta Common */}
            <div className="bg-white rounded-md border border-slate-300 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-800" />
                    <h3 className="font-bold text-slate-700 text-sm uppercase">Meta Security (Webhook)</h3>
                </div>
                <div className="p-6">
                    <SecretInput label="Verify Token" field="verifyToken" placeholder="rag_master_verify..." icon={Shield} />
                    <SecretInput label="App Secret" field="fbAppSecret" placeholder="32 chars hex..." icon={Lock} />
                </div>
            </div>

            {/* WhatsApp */}
            <div className="bg-white rounded-md border border-slate-300 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-green-600" />
                    <h3 className="font-bold text-slate-700 text-sm uppercase">WhatsApp Business</h3>
                </div>
                <div className="p-6">
                    <SecretInput label="Access Token" field="whatsappToken" placeholder="EAAG..." icon={Key} />
                    <SecretInput label="Phone Number ID" field="whatsappPhoneNumberId" placeholder="10582..." icon={Smartphone} />
                </div>
            </div>

            {/* Social Media */}
            <div className="bg-white rounded-md border border-slate-300 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-slate-700 text-sm uppercase">Facebook & Instagram</h3>
                </div>
                <div className="p-6">
                    <SecretInput label="Page Access Token" field="fbPageToken" placeholder="EAA..." icon={Key} />
                </div>
            </div>
          </div>
      )}

      {/* 2. AGENT BRAINS TAB */}
      {activeTab === 'agents' && (
          <div className="bg-white rounded-md border border-slate-300 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
             <div className="flex border-b border-slate-200 bg-slate-50">
                 <button 
                    onClick={() => setActiveAgentTab('rag')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${activeAgentTab === 'rag' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                 >
                     <MessageSquare className="w-4 h-4 mx-auto mb-1" />
                     RAG Chatbot Agent
                 </button>
                 <button 
                    onClick={() => setActiveAgentTab('marketing')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${activeAgentTab === 'marketing' ? 'border-pink-600 text-pink-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                 >
                     <Megaphone className="w-4 h-4 mx-auto mb-1" />
                     Strategy Content Agent
                 </button>
             </div>
             
             <div className="flex-1 p-0 flex flex-col relative">
                 {activeAgentTab === 'rag' && (
                     <div className="absolute top-2 right-4 z-10">
                         <button 
                            onClick={() => setLocalConfig({...localConfig, systemInstruction: MINISTRY_PROMPT})}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 transition-all opacity-90 hover:opacity-100"
                            title="Charger le prompt officiel (Meilleures Pratiques)"
                         >
                             <Sparkles className="w-3 h-3" />
                             Load Official Persona
                         </button>
                     </div>
                 )}

                 <div className="bg-[#1e1e1e] flex-1 p-4 relative group">
                    <textarea 
                        value={activeAgentTab === 'rag' ? localConfig.systemInstruction : localConfig.marketingInstruction}
                        onChange={e => {
                            if (activeAgentTab === 'rag') setLocalConfig({...localConfig, systemInstruction: e.target.value});
                            else setLocalConfig({...localConfig, marketingInstruction: e.target.value});
                        }}
                        className="w-full h-full min-h-[400px] bg-transparent text-green-400 font-mono text-xs focus:outline-none resize-none leading-relaxed p-2"
                        placeholder={activeAgentTab === 'rag' ? "You are a helpful assistant..." : "You are a creative social media manager..."}
                    />
                 </div>
                 <div className="p-3 bg-slate-100 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
                     <span>Lines: {(activeAgentTab === 'rag' ? localConfig.systemInstruction : localConfig.marketingInstruction)?.split('\n').length || 0}</span>
                     <span>{activeAgentTab === 'rag' ? 'Controls main chatbot behavior.' : 'Controls style of generated content.'}</span>
                 </div>
             </div>
          </div>
      )}

    </div>
  );
};

export default Settings;
