'use client';
import React from 'react';
import Link from 'next/link';
import { Bot, Sparkles, ArrowUpRight } from 'lucide-react';

export const Navbar = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold text-white tracking-tight flex items-center gap-1.5 font-sans">
              Sedra Tech
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </span>
            <span className="text-[11px] text-zinc-400 block font-mono">
              Support IA \n            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-300">
          <a href="#produits" className="hover:text-white transition-colors">Équipements</a>
          <a href="#garanties" className="hover:text-white transition-colors">Garantie & Délais</a>
          <a href="#demo" className="hover:text-white transition-colors flex items-center gap-1 text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" /> Démo Temps Réel
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 hover:text-white hover:border-indigo-400 text-xs font-mono font-medium transition-all shadow-lg hover:scale-105"
            title="Ouvrir le centre de support opérateur">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Dashboard Opérateur Live</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
};
