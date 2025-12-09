
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION SUPABASE ---
// 1. Essayez de remplir le fichier .env à la racine
// 2. Si cela ne fonctionne pas dans votre environnement spécifique, 
//    remplacez directement les chaînes 'VOTRE_URL...' ci-dessous.

const getEnv = (key: string) => {
  // Support pour Vite (import.meta.env), Create-React-App (process.env.REACT_APP), et Node (process.env)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
  }
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env[key] || process.env[`REACT_APP_${key}`] || process.env[`VITE_${key}`];
  }
  return '';
};

// Récupération des clés
const envUrl = getEnv('SUPABASE_URL');
const envKey = getEnv('SUPABASE_ANON_KEY');

// VALEURS DE REMPLACEMENT (Si le .env ne passe pas)
const HARDCODED_URL = 'YOUR_SUPABASE_URL'; // Remplacez ceci si nécessaire
const HARDCODED_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Remplacez ceci si nécessaire

const supabaseUrl = (envUrl && envUrl !== 'undefined') ? envUrl : HARDCODED_URL;
const supabaseAnonKey = (envKey && envKey !== 'undefined') ? envKey : HARDCODED_KEY;

const isValidUrl = (url: string) => {
  try {
    return new URL(url).protocol.startsWith('http');
  } catch (e) {
    return false;
  }
};

let supabaseInstance: any;

// Check if the URL is valid. If not, fallback to a Mock Client for demonstration.
if (isValidUrl(supabaseUrl) && supabaseUrl !== 'YOUR_SUPABASE_URL') {
  console.log("✅ Connexion Supabase initialisée avec:", supabaseUrl);
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn("⚠️ Supabase credentials not configured (Check .env or services/supabaseClient.ts). Using MOCK Authentication.");
  
  // --- MOCK CLIENT IMPLEMENTATION ---
  // This allows the UI to function without a real backend connection.
  const MOCK_STORAGE_KEY = 'rag_master_mock_session';
  
  const getMockSession = () => {
    const stored = localStorage.getItem(MOCK_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  };

  supabaseInstance = {
    auth: {
      signInWithPassword: async ({ email, password }: any) => {
        console.log(`[Mock Auth] Attempting login for ${email}`);
        
        // ADMIN Credentials
        if (email === 'admin@company.com' && password === 'password') {
          const session = { 
            access_token: 'mock_jwt_token_admin',
            token_type: 'bearer',
            user: { 
              id: 'mock-user-id-admin', 
              email: 'admin@company.com',
              aud: 'authenticated',
              created_at: new Date().toISOString(),
              user_metadata: { role: 'admin' }
            }
          };
          localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(session));
          window.dispatchEvent(new CustomEvent('supabase-auth-change', { detail: { event: 'SIGNED_IN', session } }));
          return { data: { session, user: session.user }, error: null };
        }

        // USER Credentials (New)
        if (email === 'user@company.com' && password === 'password') {
          const session = { 
            access_token: 'mock_jwt_token_user',
            token_type: 'bearer',
            user: { 
              id: 'mock-user-id-user', 
              email: 'user@company.com',
              aud: 'authenticated',
              created_at: new Date().toISOString(),
              user_metadata: { role: 'user' }
            }
          };
          localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(session));
          window.dispatchEvent(new CustomEvent('supabase-auth-change', { detail: { event: 'SIGNED_IN', session } }));
          return { data: { session, user: session.user }, error: null };
        }

        return { data: { session: null, user: null }, error: { message: 'Invalid credentials.' } };
      },
      
      signOut: async () => {
        console.log('[Mock Auth] Signing out');
        localStorage.removeItem(MOCK_STORAGE_KEY);
        window.dispatchEvent(new CustomEvent('supabase-auth-change', { detail: { event: 'SIGNED_OUT', session: null } }));
        return { error: null };
      },
      
      getSession: async () => {
        return { data: { session: getMockSession() }, error: null };
      },
      
      onAuthStateChange: (callback: any) => {
        // 1. Fire immediately with current state
        const initialSession = getMockSession();
        callback(initialSession ? 'SIGNED_IN' : 'SIGNED_OUT', initialSession);
        
        // 2. Listen for mock changes
        const listener = (e: any) => {
          const { event, session } = e.detail;
          callback(event, session);
        };
        
        window.addEventListener('supabase-auth-change', listener);
        
        return {
          data: {
            subscription: {
              unsubscribe: () => window.removeEventListener('supabase-auth-change', listener)
            }
          }
        };
      }
    }
  };
}

export const supabase = supabaseInstance;
