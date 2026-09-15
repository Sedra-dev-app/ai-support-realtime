# 🤖 Sedra Tech — Hybrid AI Support & Real-Time Human Takeover

> Application web moderne combinant un **Agent IA conversationnel en streaming ultra-rapide** (Groq Llama 3.3 70B) avec une **bascule en direct vers un conseiller humain** via WebSockets (**Supabase Realtime**).

![Stack](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwindcss)
![Groq](https://img.shields.io/badge/Groq-Llama_3.3_70B-orange?style=for-the-badge)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ecf8e?style=for-the-badge&logo=supabase)

---

## ⚡ Présentation du Projet

Ce projet résout l'un des plus grands défis du support client moderne : **offrir des réponses instantanées 24/7 grâce à l'IA tout en permettant à un humain d'intervenir en direct sans friction ni rechargement de page.**

### 🌟 Fonctionnalités Clés :

1. **Agent IA en Streaming Mot par Mot (Groq Llama 3.3 70B)** :
   - Vitesse d'inférence éclair (< 0,5s de temps de réponse).
   - Prompt système cadré & garde-fous (connaissances des produits, délais de livraison, garanties, refus des demandes hors sujet).
2. **Bascule Humaine en 1 Clic (*Human Takeover*)** :
   - Le visiteur clique sur *« Parler à un conseiller »*.
   - Le statut passe immédiatement en alerte et prévient l'équipe.
3. **Centre Opérateur Live (`/admin`) en Temps Réel** :
   - Synchronisation bidirectionnelle par **WebSockets (Supabase Realtime)**.
   - **Alerte sonore et visuelle** dès qu'un visiteur demande de l'aide.
   - L'opérateur tape sa réponse et elle apparaît en direct sur l'écran du visiteur (délai < 50ms).
4. **Interface Mobile-First & Responsive** :
   - Widget flottant en bas à droite avec animations fluides (**Framer Motion**).
   - Compatible smartphones, tablettes et ordinateurs.

---

## 🏗️ Architecture & Flux de Données

```
[ Visiteur / Client ]                   [ Dashboard Opérateur / Admin ]
        │                                             │
        ├────── 1. Question produit (Groq IA) ───────┤
        │       (Streaming instantané)                │
        │                                             │
        ├────── 2. Clic "Parler à un conseiller" ────>│ (Alerte sonore + Notification)
        │                                             │
        │<───── 3. Échange direct par WebSocket ─────>│ (Chat live synchronisé)
```

---

## 🚀 Démarrage Local

### Prérequis :
- Node.js 18+
- Clé API Groq (gratuite sur [console.groq.com](https://console.groq.com))
- Projet Supabase (gratuit sur [supabase.com](https://supabase.com))

### Installation :
```bash
# Cloner le projet
git clone https://github.com/votre-compte/ai-support-realtime.git
cd ai-support-realtime

# Installer les dépendances
npm install

# Configurer les variables d'environnement (.env.local)
GROQ_API_KEY=gsk_...
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Lancer le serveur de développement
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) pour voir la boutique et le widget client.  
Ouvrez [http://localhost:3000/admin](http://localhost:3000/admin) pour accéder à l'interface opérateur.

---

## 🛠️ Stack Technique

- **Frontend & Routing** : Next.js 15 (App Router), React 19, TypeScript
- **Design & Animations** : Tailwind CSS v4, Framer Motion, Lucide Icons
- **Moteur IA** : Vercel AI SDK (`ai`, `@ai-sdk/openai`), Groq Llama 3.3 70B
- **Base de données & Temps Réel** : Supabase PostgreSQL, Supabase Realtime Channels
- **Audio Web API** : Synthétiseur d'alertes audio sans fichiers externes

---

## 👨‍💻 Auteur

Développé par **Bessem (Sedra-dev)** — *Concepteur d'Applications Web Sur-Mesure, E-Commerce & Automatisation IA*.
- Portfolio : [sedra-dev.com](https://sedra-dev.com)
