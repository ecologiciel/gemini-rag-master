// src/services/config.ts

// Vérification sécurisée de l'environnement (évite le crash 'undefined' sur certains navigateurs)
// @ts-ignore
const isProduction = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.PROD : false;

// VOTRE URL RAILWAY EXACTE (Celle de votre capture d'écran)
const PRODUCTION_URL = 'https://gemini-rag-master-production.up.railway.app'; 

export const API_URL = isProduction 
  ? PRODUCTION_URL 
  : 'http://localhost:3000';