
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import KnowledgeBase from './components/KnowledgeBase';
import Settings from './components/Settings';
import StrategyHub from './components/StrategyHub'; 
import Profile from './components/Profile';
import UserManagement from './components/UserManagement';
import Auth from './components/Auth';
import { ViewState, AppConfig, KPIStats } from './types';
import { Loader2 } from 'lucide-react';

const defaultConfig: AppConfig = {
  geminiApiKey: '',
  systemInstruction: `RÔLE : Assistant Virtuel Officiel du Ministère de la Solidarité, de l'Insertion Sociale et de la Famille (Maroc).

CONTEXTE :
Vous êtes le premier point de contact numérique pour les citoyens marocains. Vous devez répondre aux questions concernant les programmes sociaux (RSU/RNP, Daam, Cartes d'handicap), la protection de l'enfance, et l'autonomisation des femmes, en vous basant sur le portail social.gov.ma.

DIRECTIVES DE RÉPONSE (GEMINI 2.5) :
1. GROUNDING STRICT : Répondez UNIQUEMENT en utilisant les informations présentes dans le contexte fourni (Documents RAG). Si l'information est absente, dites : "Je ne dispose pas de cette information officielle pour le moment. Veuillez consulter le portail social.gov.ma ou visiter la délégation la plus proche." Ne jamais inventer de procédures.
2. TON ET STYLE : Institutionnel, empathique, respectueux et clair. Vous représentez l'État. Évitez le jargon technique complexe sans explication.
3. LANGUE : Détectez automatiquement la langue de l'utilisateur (Arabe, Darija, Français, Tamazight) et répondez dans la même langue.
4. STRUCTURE : Pour les démarches administratives, utilisez impérativement des listes à puces (1., 2., 3.) pour la clarté.
5. URGENCE SOCIALE : Si l'utilisateur mentionne une violence, un danger immédiat ou une situation de grande détresse, donnez immédiatement les numéros verts appropriés avant toute autre réponse.

FORMAT DE SORTIE : Markdown clair et aéré.`,
  whatsappToken: '',
  messengerToken: '',
  instagramToken: '',
  verifyToken: '',
  fbAppSecret: '',
  whatsappPhoneNumberId: '',
  fbPageToken: '',
  marketingInstruction: '',
};

const mockStats: KPIStats = {
  totalRequests: 12450,
  ragSuccessRate: 94.2,
  avgLatency: 230,
  activeChannels: 3,
  estimatedCost: 12.45,
  totalTokens: { input: 450000, output: 120000 },
  topDocuments: [
      { name: 'Guide_RNP_RSU_2025.pdf', usage_count: 342, last_used_at: new Date().toISOString() },
      { name: 'Procedure_Carte_Handicap.docx', usage_count: 215, last_used_at: new Date().toISOString() },
      { name: 'Centres_Protection_Enfance.txt', usage_count: 120, last_used_at: new Date().toISOString() },
  ],
  semantic: {
      sentiment: [
          { name: 'Positif', value: 65, fill: '#10b981' },
          { name: 'Neutre', value: 25, fill: '#6366f1' },
          { name: 'Négatif', value: 10, fill: '#f43f5e' }
      ],
      topics: [
          { topic: 'Inscription RSU', count: 120 },
          { topic: 'Renouvellement Carte', count: 85 },
          { topic: 'Aides Veuves', count: 45 },
          { topic: 'Localisation Délégation', count: 30 }
      ],
      retentionRate: 78,
      engagementRate: 3.5,
      fallbackRate: 5.8
  },
  unansweredQuestions: [
      { query: "Quels sont les papiers pour l'aide au logement ?", count: 1, last_asked: new Date().toISOString() },
      { query: "Date versement allocation naissance ?", count: 1, last_asked: new Date().toISOString() }
  ]
};

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('viewer');
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [config, setConfig] = useState<AppConfig>(defaultConfig);

  // Helper to extract role from session
  const extractRole = (sessionData: any) => {
    if (!sessionData || !sessionData.user) return 'viewer';
    // Check metadata first (Used by Mock Auth)
    if (sessionData.user.user_metadata?.role) return sessionData.user.user_metadata.role;
    // Fallback default
    return 'viewer';
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUserRole(extractRole(session));
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUserRole(extractRole(session));
      // Reset view to Dashboard on login/logout to prevent stuck state
      setCurrentView(ViewState.DASHBOARD);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const savedConfig = localStorage.getItem('ragMasterConfig');
    if (savedConfig) {
      try { 
        // Merge with defaultConfig to ensure all keys are present
        setConfig({ ...defaultConfig, ...JSON.parse(savedConfig) }); 
      } catch (e) {}
    }
  }, []);

  const handleUpdateConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    localStorage.setItem('ragMasterConfig', JSON.stringify(newConfig));
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewState.DASHBOARD: 
        return <Dashboard stats={mockStats} onChangeView={setCurrentView} />;
      case ViewState.STRATEGY: return <StrategyHub />;
      case ViewState.CHAT: return <ChatInterface config={config} />;
      case ViewState.KNOWLEDGE: return <KnowledgeBase />;
      case ViewState.SETTINGS: 
        if (userRole !== 'admin') return <Dashboard stats={mockStats} onChangeView={setCurrentView} />;
        return <Settings config={config} onUpdateConfig={handleUpdateConfig} />;
      case ViewState.USERS:
        if (userRole !== 'admin') return <Dashboard stats={mockStats} onChangeView={setCurrentView} />;
        return <UserManagement />;
      case ViewState.PROFILE: return <Profile />; 
      default: return <Dashboard stats={mockStats} onChangeView={setCurrentView} />;
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!session) return <Auth />;

  return (
    <Layout currentView={currentView} onChangeView={setCurrentView} userRole={userRole}>
      {renderContent()}
    </Layout>
  );
};

export default App;
