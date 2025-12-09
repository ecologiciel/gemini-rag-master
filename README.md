# Gemini RAG Master

## Setup du Frontend (Admin Panel)
Ce projet est une application React pour administrer le chatbot.

## Setup du Backend (WhatsApp Bot)
Pour que le chatbot fonctionne réellement sur WhatsApp, vous devez lancer le serveur Node.js inclus (`server.js`).

### Prérequis
1. Node.js installé.
2. Un compte Meta Developer avec une app WhatsApp configurée.
3. Une clé API Google Gemini.

### Installation & Lancement
1. Ouvrez un terminal à la racine.
2. Installez les dépendances :
   ```bash
   npm install express body-parser axios dotenv @google/genai
   ```
3. Créez un fichier `.env` avec vos clés :
   ```env
   WHATSAPP_TOKEN=votre_token_meta
   VERIFY_TOKEN=rag_master_verify_token
   GEMINI_API_KEY=votre_cle_gemini
   ```
4. Lancez le serveur :
   ```bash
   node server.js
   ```
5. Utilisez **Ngrok** pour exposer le port 3000 :
   ```bash
   ngrok http 3000
   ```
6. Copiez l'URL HTTPS de Ngrok (ex: `https://abcd-123.ngrok-free.app/webhook`) dans la configuration Webhook de votre app Meta.
7. Dans Meta, configurez le "Verify Token" sur `rag_master_verify_token`.

Une fois connecté, tout message envoyé au numéro WhatsApp de test sera traité par Gemini via `server.js`.
