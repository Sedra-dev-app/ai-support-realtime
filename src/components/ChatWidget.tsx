'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, Sparkles, UserCheck, ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { playNotificationSound } from '@/lib/audio';
import { Message } from '@/types/chat';

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'ai' | 'human_requested' | 'human_active'>('ai');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'ai',
      content: "Bonjour ! Je suis Nova, l'assistant virtuel de Sedra Tech. Je peux vous renseigner sur nos équipements, la livraison 24h ou nos garanties. Que recherchez-vous ?",
      created_at: new Date().toISOString(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // 1. Initialiser ou récupérer la conversation dans Supabase
  const getOrCreateConversation = async (): Promise<string> => {
    if (conversationId) return conversationId;

    try {
      const visitorTag = 'Visiteur #' + Math.floor(1000 + Math.random() * 9000);
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          visitor_name: visitorTag,
          status: mode,
        })
        .select()
        .single();

      if (error || !data) {
        console.warn('Erreur Supabase conversation:', error);
        const fallbackId = 'local-' + Date.now();
        setConversationId(fallbackId);
        return fallbackId;
      }

      setConversationId(data.id);
      return data.id;
    } catch (e) {
      const fallbackId = 'local-' + Date.now();
      setConversationId(fallbackId);
      return fallbackId;
    }
  };

  // 2. Écouter les messages en Temps Réel de l'opérateur humain via Supabase Realtime
  useEffect(() => {
    if (!conversationId || conversationId.startsWith('local-')) return;

    const channel = supabase
      .channel('chat_' + conversationId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.sender === 'agent') {
            playNotificationSound('chime');
            setMode('human_active');
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`,
        },
        (payload: any) => {
          if (payload.new?.status === 'human_active') {
            setMode('human_active');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // 3. Basculer vers un conseiller humain en direct
  const requestHumanTakeover = async () => {
    setMode('human_requested');
    const convId = await getOrCreateConversation();

    await supabase
      .from('conversations')
      .update({ status: 'human_requested' })
      .eq('id', convId);

    const alertMsg: Message = {
      id: 'sys-' + Date.now(),
      sender: 'ai',
      content: "🔔 Demande transmise ! Votre conversation a été transmise à notre équipe en direct. Un conseiller prend le relais d'ici quelques instants...",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, alertMsg]);
  };

  // 4. Envoi de message (Visiteur -> IA ou Conseiller)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setInput('');
    const userMsg: Message = {
      id: 'user-' + Date.now(),
      sender: 'visitor',
      content: trimmed,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);

    const convId = await getOrCreateConversation();

    // Sauvegarder le message du visiteur dans Supabase
    await supabase.from('messages').insert({
      conversation_id: convId,
      sender: 'visitor',
      content: trimmed,
    });

    // Cas A : Mode Conseiller Humain actif
    if (mode === 'human_requested' || mode === 'human_active') {
      return;
    }

    // Cas B : Mode IA actif (Streaming temps réel Groq)
    setIsLoading(true);
    try {
      const chatHistory = messages
        .filter((m) => m.sender === 'visitor' || m.sender === 'ai')
        .map((m) => ({
          role: m.sender === 'visitor' ? 'user' : 'assistant',
          content: m.content,
        }));

      chatHistory.push({ role: 'user', content: trimmed });

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory }),
      });

      if (!res.ok || !res.body) {
        throw new Error('Erreur lors du streaming');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiText = '';

      const aiMsgId = 'ai-' + Date.now();
      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          sender: 'ai',
          content: '',
          created_at: new Date().toISOString(),
        },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        aiText += chunk;

        setMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, content: aiText } : m))
        );
      }

      // Enregistrer le message final de l'IA dans Supabase
      if (convId) {
        await supabase.from('messages').insert({
          conversation_id: convId,
          sender: 'ai',
          content: aiText,
        });
      }
    } catch (err) {
      console.error('Erreur streaming:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          sender: 'ai',
          content: "Désolé, une petite coupure est survenue. N'hésitez pas à cliquer sur 'Parler à un conseiller' pour une assistance en direct.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Bouton Bulle Flottante */}
      {!isOpen && (
        <motion.button
          onClick={() => setIsOpen(true)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative group flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-4 rounded-full shadow-2xl hover:shadow-indigo-500/25 transition-all duration-300 border border-white/20 cursor-pointer"
        >
          <div className="relative">
            <Bot className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-zinc-950 animate-pulse" />
          </div>
          <span className="text-sm font-medium tracking-wide">
            Besoin d&apos;aide ? <strong className="font-bold">Chat Live</strong>
          </span>
        </motion.button>
      )}

      {/* Fenêtre de Chat Expandable */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-[380px] sm:w-[420px] h-[580px] max-h-[85vh] bg-zinc-950/95 backdrop-blur-xl border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  {mode === 'human_active' ? (
                    <UserCheck className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Bot className="w-5 h-5" />
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-zinc-900" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                    {mode === 'human_active' ? 'Conseiller Sedra Tech' : 'Nova — Support IA'}
                    {mode === 'ai' && <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {mode === 'human_active'
                      ? '🧑‍💼 Échange humain en direct'
                      : mode === 'human_requested'
                      ? '⏳ Alerte conseiller en cours...'
                      : '⚡ Réponses instantanées 24/7'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Barre de bascule vers un humain */}
            {mode === 'ai' && (
              <div className="px-4 py-2 bg-indigo-950/40 border-b border-indigo-500/20 flex items-center justify-between text-xs">
                <span className="text-zinc-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  Support Hybride
                </span>
                <button
                  onClick={requestHumanTakeover}
                  className="text-indigo-300 hover:text-white font-medium underline underline-offset-2 transition-colors cursor-pointer"
                >
                  🧑‍💼 Parler à un conseiller
                </button>
              </div>
            )}

            {mode === 'human_requested' && (
              <div className="px-4 py-2 bg-amber-950/40 border-b border-amber-500/30 flex items-center gap-2 text-xs text-amber-300 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Un conseiller a été alerté, connexion en cours...</span>
              </div>
            )}

            {mode === 'human_active' && (
              <div className="px-4 py-2 bg-emerald-950/40 border-b border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Conseiller en ligne. Vous échangez en temps réel.</span>
              </div>
            )}

            {/* Zone des messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-sm">
              {messages.map((msg, idx) => {
                const isUser = msg.sender === 'visitor';
                const isAgent = msg.sender === 'agent';

                return (
                  <div
                    key={msg.id || idx}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    {isAgent && (
                      <span className="text-[10px] font-mono text-emerald-400 mb-1 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" /> Conseiller en direct
                      </span>
                    )}
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none shadow-lg'
                          : isAgent
                          ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-100 rounded-bl-none shadow-md'
                          : 'bg-zinc-900 border border-white/10 text-zinc-200 rounded-bl-none shadow-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-zinc-400 py-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  <span>Nova réfléchit et répond...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Formulaire de saisie */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-zinc-900/50">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  maxLength={300}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    mode === 'human_active'
                      ? 'Écrivez à votre conseiller en direct...'
                      : 'Posez votre question à Nova...'
                  }
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2.5 w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-zinc-500">
                <span>{300 - input.length} caractères restants</span>
                <span>Temps réel WebSockets</span>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
