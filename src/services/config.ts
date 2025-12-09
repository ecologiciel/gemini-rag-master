
// Si l'application tourne sur Vercel (Production), on utilise l'URL Railway.
// Sinon (Local), on utilise localhost:3000.

const isProduction = import.meta.env.PROD;

// TODO: Une fois déployé sur Railway, remplacez la chaîne vide ci-dessous par votre URL Railway (ex: https://mon-projet.up.railway.app)
const PRODUCTION_URL = 'https://YOUR_RAILWAY_URL.up.railway.app'; 

export const API_URL = isProduction 
  ? PRODUCTION_URL 
  : 'http://localhost:3000';
