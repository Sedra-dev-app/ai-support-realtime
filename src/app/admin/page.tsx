'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Bot, 
  UserCheck, 
  Send, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Radio, 
  Volume2, 
  Sparkles, 
  RefreshCw,
  MessageSquare,
  RotateCcw,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { playNotificationSound } from '@/lib/audio';
import { Conversation, Message } from '@/types/chat';

// 3 Conversations réalistes de démonstration (Sandbox Pro)
const MOCK_DATA: { conversation: Conversation; messages: Message[] }[] = [
  {
    conversation: {
      id: 'mock-1',
      visitor_name: 'Alexandre M. (Entreprise Lumio)',
      status: 'closed',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    messages: [
      {
        id: 'm-1',
        conversation_id: 'mock-1',
        sender: 'visitor',
        content: "Bonjour, nous souhaitons équiper 10 postes de travail avec l'Écran Pro 4K UltraWide 144Hz. Proposez-vous un tarif dégressif ?",
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'm-2',
        conversation_id: 'mock-1',
        sender: 'ai',
        content: "Bonjour ! Oui, pour les commandes pro à partir de 5 unités, nous appliquons une remise de 15% ainsi que la livraison express 24h offerte sur devis sous 24h.",
        created_at: new Date(Date.now() - 3600000 * 2 + 5000).toISOString(),
      },
      {
        id: 'm-3',
        conversation_id: 'mock-1',
        sender: 'visitor',
        content: "Parfait, je finalise le bon de commande par virement. Merci pour votre réactivité !",
        created_at: new Date(Date.now() - 3600000 * 2 + 60000).toISOString(),
      },
      {
        id: 'm-4',
        conversation_id: 'mock-1',
        sender: 'agent',
        content: "C'est noté Alexandre, notre pôle B2B a préparé votre bon de commande. Excellente journée !",
        created_at: new Date(Date.now() - 3600000 * 2 + 120000).toISOString(),
      }
    ]
  },
  {
    conversation: {
      id: 'mock-2',
      visitor_name: 'Sophie B. (Studio Design)',
      status: 'closed',
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    messages: [
      {
        id: 'm-5',
        conversation_id: 'mock-2',
        sender: 'visitor',
        content: "Le Hub 10-en-1 Thunderbolt est-il pleinement compatible avec les puces Apple Silicon M2/M3 et le double affichage étendu ?",
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: 'm-6',
        conversation_id: 'mock-2',
        sender: 'ai',
        content: "Oui tout à fait ! Le Hub gère le double affichage 4K 60Hz natif sur Mac M-Series grâce à ses contrôleurs certifiés et son alimentation 100W Pass-Through.",
        created_at: new Date(Date.now() - 3600000 * 5 + 4000).toISOString(),
      }
    ]
  },
  {
    conversation: {
      id: 'mock-3',
      visitor_name: 'Karim T. (Développeur Freelance)',
      status: 'closed',
      created_at: new Date(Date.now() - 3600000 * 9).toISOString(),
    },
    messages: [
      {
        id: 'm-7',
        conversation_id: 'mock-3',
        sender: 'visitor',
        content: "Le Clavier Mécanique Sans Fil RGB a-t-il des touches de rechange pour disposition Mac ?",
        created_at: new Date(Date.now() - 3600000 * 9).toISOString(),
      },
      {
        id: 'm-8',
        conversation_id: 'mock-3',
        sender: 'ai',
        content: "Oui, les touches Option et Commande pour macOS sont incluses dans la boîte avec l'extracteur de switches.",
        created_at: new Date(Date.now() - 3600000 * 9 + 3000).toISOString(),
      }
    ]
  }
];

export default function AdminDashboardPage() {
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_DATA.map((d) => d.conversation));
  const [userActiveConvId, setUserActiveConvId] = useState<string | null>(null);
  const [selectedConvId, setSelectedConvId] = useState<string>('mock-1');
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [filter, setFilter] = useState<'all' | 'human_requested' | 'human_active' | 'closed'>('all');
  const [hasSoundAlert, setHasSoundAlert] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Initialisation : Charger la session de test de l'utilisateur si elle existe
  const loadUserSession = async () => {
    let targetConvId: string | null = null;

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      targetConvId = params.get('conv') || localStorage.getItem('sedra_chat_conv_id');
    }

    if (targetConvId && !targetConvId.startsWith('local-')) {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', targetConvId)
          .single();

        if (data && !error) {
          const liveConv: Conversation = {
            ...data,
            visitor_name: `${data.visitor_name} (Votre Session en Direct)`,
          };

          setUserActiveConvId(data.id);
          setSelectedConvId(data.id);

          // Placer la session utilisateur TOUT EN HAUT de la liste
          setConversations([liveConv, ...MOCK_DATA.map((d) => d.conversation)]);
          return;
        }
      } catch (e) {
        console.warn('Session introuvable dans Supabase:', e);
      }
    }

    // Si aucune session utilisateur trouvée, afficher les données mockées
    setConversations(MOCK_DATA.map((d) => d.conversation));
    setSelectedConvId('mock-1');
  };

  useEffect(() => {
    loadUserSession();
  }, []);

  // 2. Charger les messages selon la conversation sélectionnée
  useEffect(() => {
    if (!selectedConvId) return;

    // Si c'est un mock
    if (selectedConvId.startsWith('mock-')) {
      const found = MOCK_DATA.find((m) => m.conversation.id === selectedConvId);
      setMessages(found ? found.messages : []);
      return;
    }

    // Si c'est la vraie session utilisateur
    const loadLiveMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConvId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data as Message[]);
      }
    };

    loadLiveMessages();
  }, [selectedConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Écoute en Temps Réel UNIQUEMENT sur la session de l'utilisateur (Cloisonnement 100% sécurisé)
  useEffect(() => {
    if (!userActiveConvId) return;

    const channel = supabase
      .channel('admin_user_session_' + userActiveConvId)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${userActiveConvId}`,
        },
        (payload) => {
          const updated = payload.new as Conversation;
          setConversations((prev) =>
            prev.map((c) =>
              c.id === updated.id
                ? { ...updated, visitor_name: `${updated.visitor_name} (Votre Session en Direct)` }
                : c
            )
          );

          if (updated.status === 'human_requested' && hasSoundAlert) {
            playNotificationSound('beep');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${userActiveConvId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (selectedConvId === userActiveConvId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userActiveConvId, selectedConvId, hasSoundAlert]);

  // 4. Prendre le relais de l'IA sur la session en direct
  const handleTakeover = async () => {
    if (!selectedConvId || selectedConvId.startsWith('mock-')) return;

    await supabase
      .from('conversations')
      .update({ status: 'human_active' })
      .eq('id', selectedConvId);

    setConversations((prev) =>
      prev.map((c) => (c.id === selectedConvId ? { ...c, status: 'human_active' } : c))
    );

    // Message système automatique
    await supabase.from('messages').insert({
      conversation_id: selectedConvId,
      sender: 'agent',
      content: "Bonjour ! Je suis votre conseiller en direct. J'ai pris le relais de Nova, comment puis-je vous aider ?",
    });
  };

  // 5. Clôturer la conversation
  const handleCloseConversation = async () => {
    if (!selectedConvId || selectedConvId.startsWith('mock-')) return;

    await supabase
      .from('conversations')
      .update({ status: 'closed' })
      .eq('id', selectedConvId);

    setConversations((prev) =>
      prev.map((c) => (c.id === selectedConvId ? { ...c, status: 'closed' } : c))
    );
  };

  // 6. Répondre au client en direct
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConvId || isSending) return;

    if (selectedConvId.startsWith('mock-')) {
      alert("Ceci est un exemple de conversation archivée. Pour tester l'envoi en direct, utilisez votre propre session en direct (tout en haut) !");
      return;
    }

    setIsSending(true);
    const content = replyText.trim();
    setReplyText('');

    try {
      await supabase.from('messages').insert({
        conversation_id: selectedConvId,
        sender: 'agent',
        content,
      });

      const currentConv = conversations.find((c) => c.id === selectedConvId);
      if (currentConv && currentConv.status !== 'human_active') {
        await supabase
          .from('conversations')
          .update({ status: 'human_active' })
          .eq('id', selectedConvId);
      }
    } catch (err) {
      console.error('Erreur envoi réponse:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Réinitialiser la session de test locale
  const handleResetSession = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sedra_chat_conv_id');
      window.location.href = '/admin';
    }
  };

  const currentConv = conversations.find((c) => c.id === selectedConvId);
  const isSelectedMock = selectedConvId.startsWith('mock-');
  const isSelectedUser = selectedConvId === userActiveConvId;

  const filteredConversations = conversations.filter((c) => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  const pendingCount = conversations.filter((c) => c.status === 'human_requested').length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col">
      {/* Header Topbar */}
      <header className="h-16 border-b border-white/10 bg-zinc-900/70 backdrop-blur-xl px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour Boutique
          </Link>

          <div className="h-4 w-px bg-white/15" />

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                Centre Opérateur Live — Sedra Support
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                  Temps Réel Sécurisé
                </span>
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {userActiveConvId && (
            <button
              onClick={handleResetSession}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Effacer la session de test actuelle pour en démarrer une neuve"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Nouveau Test</span>
            </button>
          )}

          <button
            onClick={() => setHasSoundAlert(!hasSoundAlert)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-2 transition-colors cursor-pointer ${
              hasSoundAlert
                ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                : 'bg-white/5 border-white/10 text-zinc-500'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Son : {hasSoundAlert ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={loadUserSession}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Bannière explicative d'isolation Sandbox */}
      {!userActiveConvId && (
        <div className="bg-indigo-950/40 border-b border-indigo-500/20 px-6 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              <strong>Mode Démonstration Pro :</strong> Vous visualisez des exemples de tickets d&apos;entreprise archivés. Pour tester la prise de relais en direct avec vos propres messages :
            </span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-white font-medium bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded-full font-mono text-[11px] transition-colors"
          >
            Lancer un test sur la boutique
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Main Workspace : 2 Colonnes */}
      <div className="flex-1 flex overflow-hidden">
        {/* Colonne Gauche : Liste des Conversations */}
        <aside className="w-80 md:w-96 border-r border-white/10 bg-zinc-900/30 flex flex-col">
          {/* Filtres de statut */}
          <div className="p-4 border-b border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                Conversations ({conversations.length})
              </span>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono animate-pulse flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {pendingCount} alerte !
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-1.5 bg-zinc-900 p-1 rounded-xl border border-white/5 text-[11px] font-medium">
              <button
                onClick={() => setFilter('all')}
                className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filter === 'all' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Toutes
              </button>
              <button
                onClick={() => setFilter('human_requested')}
                className={`py-1.5 rounded-lg transition-colors cursor-pointer relative ${
                  filter === 'human_requested' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Alertes
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />
                )}
              </button>
              <button
                onClick={() => setFilter('human_active')}
                className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filter === 'human_active' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                En direct
              </button>
              <button
                onClick={() => setFilter('closed')}
                className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filter === 'closed' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Finies
              </button>
            </div>
          </div>

          {/* Liste défilante */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs font-mono">
                Aucune conversation dans cette catégorie.
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = c.id === selectedConvId;
                const isPending = c.status === 'human_requested';
                const isActive = c.status === 'human_active';
                const isUserLive = c.id === userActiveConvId;

                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedConvId(c.id)}
                    className={`w-full text-left p-4 transition-all flex flex-col gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-white/10 border-l-4 border-indigo-500'
                        : isPending
                        ? 'bg-amber-950/30 hover:bg-amber-950/50 border-l-4 border-amber-400 animate-pulse'
                        : isUserLive
                        ? 'bg-indigo-950/20 hover:bg-indigo-950/40 border-l-4 border-indigo-400'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-white flex items-center gap-1.5 truncate">
                        {isUserLive && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />}
                        {c.visitor_name}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPending && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                          <AlertTriangle className="w-3 h-3" /> Humain demandé !
                        </span>
                      )}
                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                          <UserCheck className="w-3 h-3" /> Conseiller en direct
                        </span>
                      )}
                      {c.status === 'ai' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                          <Bot className="w-3 h-3 text-indigo-400" /> Géré par Nova IA
                        </span>
                      )}
                      {c.status === 'closed' && (
                        <span className="text-[11px] font-mono text-zinc-500">
                          {c.id.startsWith('mock-') ? 'Archivé (Exemple)' : 'Terminée'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Colonne Droite : Fil de Chat & Console de Réponse */}
        <main className="flex-1 flex flex-col bg-zinc-950">
          {currentConv ? (
            <>
              {/* Header de la conversation active */}
              <div className="p-4 border-b border-white/10 bg-zinc-900/40 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-semibold text-white flex items-center gap-2">
                      {currentConv.visitor_name}
                      {isSelectedUser && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono">
                          Live Active
                        </span>
                      )}
                      {isSelectedMock && (
                        <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 text-xs font-mono">
                          Démo Archivée
                        </span>
                      )}
                    </h2>
                    <span className="text-xs text-zinc-500 font-mono">ID: {currentConv.id.slice(0, 8)}...</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {isSelectedUser
                      ? 'Connecté à votre navigateur en direct (WebSockets Supabase)'
                      : 'Exemple de ticket client résolu'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {currentConv.status === 'human_requested' && isSelectedUser && (
                    <button
                      onClick={handleTakeover}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-amber-500/20 animate-pulse transition-all cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Prendre le relais maintenant</span>
                    </button>
                  )}

                  {currentConv.status === 'human_active' && isSelectedUser && (
                    <button
                      onClick={handleCloseConversation}
                      className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Clôturer le ticket
                    </button>
                  )}
                </div>
              </div>

              {/* Fil des messages */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 space-y-2">
                    <MessageSquare className="w-8 h-8 opacity-40" />
                    <p className="text-sm font-mono">En attente des premiers messages...</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isVisitor = m.sender === 'visitor';
                    const isAgent = m.sender === 'agent';
                    const isAi = m.sender === 'ai';

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
                            {isVisitor && '👤 Client'}
                            {isAgent && '🧑‍💼 Vous (Opérateur)'}
                            {isAi && (
                              <span className="text-indigo-400 flex items-center gap-1">
                                <Bot className="w-3 h-3" /> Nova IA
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            isAgent
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/10'
                              : isVisitor
                              ? 'bg-zinc-900 border border-white/10 text-zinc-200'
                              : 'bg-indigo-950/40 border border-indigo-500/30 text-indigo-100'
                          }`}
                        >
                          {m.content}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Console de réponse opérateur */}
              <div className="p-4 border-t border-white/10 bg-zinc-900/50">
                {isSelectedMock ? (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-zinc-400 font-mono flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-zinc-500" />
                    <span>Conversation d&apos;exemple archivée. Pour tester l&apos;envoi en direct, sélectionnez votre session active tout en haut.</span>
                  </div>
                ) : (
                  <form onSubmit={handleSendReply} className="flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={
                        currentConv.status === 'human_requested'
                          ? 'Cliquez d\'abord sur « Prendre le relais » ou tapez directement votre réponse...'
                          : 'Tapez votre message au visiteur en direct...'
                      }
                      disabled={isSending}
                      className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-sans"
                    />

                    <button
                      type="submit"
                      disabled={!replyText.trim() || isSending}
                      className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-medium flex items-center gap-2 transition-all cursor-pointer shrink-0 shadow-lg shadow-indigo-600/20"
                    >
                      <Send className="w-4 h-4" />
                      <span className="text-xs font-mono uppercase">Répondre</span>
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500 text-sm font-mono">
              Sélectionnez une conversation dans la liste.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

