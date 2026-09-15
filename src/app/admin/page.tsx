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
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { playNotificationSound } from '@/lib/audio';
import { Conversation, Message } from '@/types/chat';

export default function AdminDashboardPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [filter, setFilter] = useState<'all' | 'human_requested' | 'human_active' | 'closed'>('all');
  const [hasSoundAlert, setHasSoundAlert] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Charger les conversations existantes
  const loadConversations = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setConversations(data as Conversation[]);
      if (data.length > 0 && !selectedConvId) {
        setSelectedConvId(data[0].id);
      }
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // 2. Charger les messages de la conversation sélectionnée
  useEffect(() => {
    if (!selectedConvId) return;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConvId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data as Message[]);
      }
    };

    loadMessages();
  }, [selectedConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Écoute globale en Temps Réel (WebSockets Supabase)
  useEffect(() => {
    const channel = supabase
      .channel('admin_global_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setConversations((prev) => [payload.new as Conversation, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Conversation;
            setConversations((prev) =>
              prev.map((c) => (c.id === updated.id ? updated : c))
            );

            // Alerte sonore si un visiteur réclame un humain !
            if (updated.status === 'human_requested') {
              if (hasSoundAlert) playNotificationSound('beep');
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.conversation_id === selectedConvId) {
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
  }, [selectedConvId, hasSoundAlert]);

  // 4. Prendre le relais (passer en human_active)
  const handleTakeover = async () => {
    if (!selectedConvId) return;

    await supabase
      .from('conversations')
      .update({ status: 'human_active' })
      .eq('id', selectedConvId);

    setConversations((prev) =>
      prev.map((c) => (c.id === selectedConvId ? { ...c, status: 'human_active' } : c))
    );

    // Message système
    await supabase.from('messages').insert({
      conversation_id: selectedConvId,
      sender: 'agent',
      content: "Bonjour ! Je suis votre conseiller en direct. J'ai pris le relais de Nova, comment puis-je vous aider ?",
    });
  };

  // 5. Clôturer la conversation
  const handleCloseConversation = async () => {
    if (!selectedConvId) return;

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

    setIsSending(true);
    const content = replyText.trim();
    setReplyText('');

    try {
      await supabase.from('messages').insert({
        conversation_id: selectedConvId,
        sender: 'agent',
        content,
      });

      // Si le statut était encore 'human_requested', on le bascule en 'human_active'
      const currentConv = conversations.find((c) => c.id === selectedConvId);
      if (currentConv && currentConv.status !== 'human_active') {
        await supabase
          .from('conversations')
          .update({ status: 'human_active' })
          .eq('id', selectedConvId);
      }
    } catch (err) {
      console.error('Erreur envoi:', err);
    } finally {
      setIsSending(false);
    }
  };

  const currentConv = conversations.find((c) => c.id === selectedConvId);

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
                  Temps Réel Actif
                </span>
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setHasSoundAlert(!hasSoundAlert)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-2 transition-colors cursor-pointer ${
              hasSoundAlert
                ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                : 'bg-white/5 border-white/10 text-zinc-500'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Alertes sonores : {hasSoundAlert ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={loadConversations}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

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
                  {pendingCount} en attente
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
                Aucune conversation trouvée dans cette catégorie.
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = c.id === selectedConvId;
                const isPending = c.status === 'human_requested';
                const isActive = c.status === 'human_active';

                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedConvId(c.id)}
                    className={`w-full text-left p-4 transition-all flex flex-col gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-white/10 border-l-4 border-indigo-500'
                        : isPending
                        ? 'bg-amber-950/25 hover:bg-amber-950/40 border-l-4 border-amber-400'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-white flex items-center gap-2">
                        {c.visitor_name}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPending && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md animate-pulse">
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
                          Terminée
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
                    <h2 className="text-base font-semibold text-white">
                      {currentConv.visitor_name}
                    </h2>
                    <span className="text-xs text-zinc-500 font-mono">ID: {currentConv.id.slice(0, 8)}...</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Démarrée le {new Date(currentConv.created_at).toLocaleDateString()} à {new Date(currentConv.created_at).toLocaleTimeString()}
                  </p>
                </div>

                {/* Actions de l'opérateur */}
                <div className="flex items-center gap-3">
                  {currentConv.status === 'human_requested' && (
                    <button
                      onClick={handleTakeover}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer animate-bounce"
                    >
                      <UserCheck className="w-4 h-4" />
                      Prendre le relais maintenant
                    </button>
                  )}

                  {currentConv.status === 'ai' && (
                    <button
                      onClick={handleTakeover}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" />
                      Intervenir en direct
                    </button>
                  )}

                  {currentConv.status !== 'closed' && (
                    <button
                      onClick={handleCloseConversation}
                      className="px-3 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Clôturer
                    </button>
                  )}
                </div>
              </div>

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-zinc-500 text-sm py-12">
                    En attente des premiers messages...
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isVisitor = m.sender === 'visitor';
                    const isAi = m.sender === 'ai';
                    const isAgent = m.sender === 'agent';

                    return (
                      <div
                        key={m.id || idx}
                        className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-2 mb-1 text-[11px] font-mono text-zinc-400">
                          {isVisitor && <span className="text-indigo-400 font-semibold">{currentConv.visitor_name}</span>}
                          {isAi && <span className="text-zinc-400 flex items-center gap-1"><Bot className="w-3 h-3 text-indigo-400" /> Nova (IA)</span>}
                          {isAgent && <span className="text-emerald-400 font-semibold flex items-center gap-1"><UserCheck className="w-3 h-3" /> Vous (Opérateur)</span>}
                          <span>· {m.created_at ? new Date(m.created_at).toLocaleTimeString() : ''}</span>
                        </div>

                        <div
                          className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                            isAgent
                              ? 'bg-emerald-600 text-white rounded-br-none shadow-lg'
                              : isVisitor
                              ? 'bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border border-indigo-500/30 text-white rounded-bl-none'
                              : 'bg-zinc-900 border border-white/10 text-zinc-300 rounded-bl-none'
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

              {/* Input pour répondre au client en temps réel */}
              <form onSubmit={handleSendReply} className="p-4 border-t border-white/10 bg-zinc-900/60 flex gap-3">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Écrivez votre message au visiteur en direct..."
                  className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || isSending}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Envoyer en Direct</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-sm">
              <MessageSquare className="w-10 h-10 mb-2 opacity-40" />
              Sélectionnez une conversation pour afficher le direct.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
