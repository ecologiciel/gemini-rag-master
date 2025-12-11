
export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  CHAT = 'CHAT',
  KNOWLEDGE = 'KNOWLEDGE',
  STRATEGY = 'STRATEGY',
  SETTINGS = 'SETTINGS',
  USERS = 'USERS',
  PROFILE = 'PROFILE',
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

// NEW: For Admin Inbox
export interface ChatSession {
    userId: string;
    lastMessage: string;
    lastActive: Date;
    channel: 'whatsapp' | 'web';
    unreadCount?: number;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  hash: string;
  status: 'processing' | 'success' | 'error' | 'duplicate';
  uploadDate: Date;
}

export interface AppConfig {
  // Google
  geminiApiKey: string;
  
  // Meta Common
  verifyToken: string;
  fbAppSecret: string;
  
  // WhatsApp
  whatsappToken: string;
  whatsappPhoneNumberId: string;
  
  // Social (Messenger/Insta)
  messengerToken: string;
  instagramToken: string;
  fbPageToken: string;

  // AI Brains
  systemInstruction: string; // RAG Chatbot
  marketingInstruction: string; // Strategy Generator
}

export interface DocumentStat {
  name: string;
  usage_count: number;
  last_used_at: string;
}

export interface TokenStats {
  input: number;
  output: number;
}

export interface TopicStat {
  topic: string;
  count: number;
}

export interface QuestionStat {
  query: string;
  count: number;
  last_asked: string;
}

export interface SemanticStats {
  sentiment: { name: string; value: number; fill: string }[];
  topics: TopicStat[];
  retentionRate: number;
  engagementRate: number;
  fallbackRate: number;
}

export interface KPIStats {
  totalRequests: number;
  ragSuccessRate: number;
  avgLatency: number;
  activeChannels: number;
  history?: any[];
  totalTokens?: TokenStats;
  estimatedCost?: number;
  topDocuments?: DocumentStat[];
  semantic?: SemanticStats;
  unansweredQuestions?: QuestionStat[];
  topQuestions?: QuestionStat[];
}

// --- STRATEGY HUB TYPES ---

export type StrategyMode = 'messaging' | 'social';

export interface StrategyConfig {
  startDate: string;
  endDate: string;
  mode: StrategyMode;
  
  // General Inputs
  language: 'fr' | 'en' | 'es' | 'ar';
  contentFilter: 'frequent_questions' | 'low_confidence' | 'negative_sentiment';
  
  // Strategic Inputs
  objective: 'inform' | 'educate' | 'action' | 'correct' | 'event';
  tone: 'formal' | 'friendly' | 'urgent' | 'educational';
}

export interface GeneratedContent {
  platform: 'WhatsApp' | 'Facebook' | 'Instagram';
  content: string;
  image_prompt?: string;
  hashtags?: string[];
}

export interface StrategyTheme {
  title: string;
  recommendation: string;
  best_posting_time: string;
  rag_source_docs: string[];
  content: GeneratedContent[];
}

export interface StrategyResult {
  synthesis: string;
  themes: StrategyTheme[];
  generatedAt: string;
  mode: StrategyMode;
}

// --- USER MANAGEMENT TYPES ---

export interface ManagedUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'user' | 'viewer';
    status: 'active' | 'invited' | 'suspended';
    lastActive: string;
    avatarUrl?: string;
}
