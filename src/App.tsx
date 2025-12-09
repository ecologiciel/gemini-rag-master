
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import KnowledgeBase from './components/KnowledgeBase';
import Settings from './components/Settings';
import StrategyHub from './components/StrategyHub'; 
import Profile from './components/Profile';
import UserManagement from './components/UserManagement'; // New Import
import Auth from './components/Auth';
import { ViewState, AppConfig, KPIStats } from './types';
import { Loader2 } from 'lucide-react';

const defaultConfig: AppConfig = {
  geminiApiKey: '',
  systemInstruction: `You are a helpful and polite assistant.`,
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
      { name: 'Product_Manual_v2.pdf', usage_count: 342, last_used_at: new Date().toISOString() },
      { name: 'Pricing_2025.docx', usage_count: 215, last_used_at: new Date().toISOString() },
      { name: 'Return_Policy.txt', usage_count: 120, last_used_at: new Date().toISOString() },
  ],
  semantic: {
      sentiment: [
          { name: 'Positive', value: 65, fill: '#10b981' },
          { name: 'Neutral', value: 25, fill: '#6366f1' },
          { name: 'Negative', value: 10, fill: '#f43f5e' }
      ],
      topics: [
          { topic: 'Pricing', count: 120 },
          { topic: 'Technical Support', count: 85 },
          { topic: 'Refunds', count: 45 },
          { topic: 'Availability', count: 30 }
      ],
      retentionRate: 78,
      engagementRate: 3.5,
      fallbackRate: 5.8
  },
  unansweredQuestions: [
      { query: "Do you offer shipping to Mars?", count: 1, last_asked: new Date().toISOString() },
      { query: "How do I hack the mainframe?", count: 1, last_asked: new Date().toISOString() }
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