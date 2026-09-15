'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { ChatWidget } from '@/components/ChatWidget';
import { 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  Headphones, 
  Monitor, 
  Keyboard, 
  Cpu, 
  Radio, 
  ArrowRight, 
  Check, 
  Zap,
  ArrowUpRight
} from 'lucide-react';

const products = [
  {
    id: 'screen-pro',
    name: 'Écran Pro 4K UltraWide 144Hz',
    price: '349 €',
    tag: 'Bestseller Développeurs',
    icon: Monitor,
    description: 'Dalle IPS 34 pouces incurvée 1500R, 99% sRGB, port USB-C 90W avec Power Delivery.',
    specs: ['4K UltraWide (3440 x 1440)', 'Fréquence 144Hz · 1ms', 'Charge USB-C 90W intégrée']
  },
  {
    id: 'keyboard-wireless',
    name: 'Clavier Mécanique Sans Fil RGB',
    price: '129 €',
    tag: 'Confort Frappe Ultime',
    icon: Keyboard,
    description: 'Châssis en aluminium anodisé, switches pré-lubrifiés ultra silencieux et 200h d autonomie.',
    specs: ['Connexion Tri-Mode (2.4G, Bluetooth, USB-C)', 'Touches PBT Double-Shot', 'Compatible Mac & Windows']
  },
  {
    id: 'hub-thunderbolt',
    name: 'Hub 10-en-1 Thunderbolt Pro',
    price: '69 €',
    tag: 'Essentiel Desk Setup',
    icon: Cpu,
    description: 'Station d accueil universelle avec double sortie HDMI 4K 60Hz, Ethernet Gigabit et lecteur SD UHS-II.',
    specs: ['Double HDMI 4K 60Hz', 'Pass-Through 100W', 'Boîtier aluminium thermique']
  },
  {
    id: 'headset-anc',
    name: 'Casque Studio Sans Fil ANC',
    price: '159 €',
    tag: 'Isolation Sonore',
    icon: Headphones,
    description: 'Réduction active de bruit adaptative, audio spatialisé haute résolution et micro antibruit assisté par IA.',
    specs: ['Réduction de bruit -40dB', 'Autonomie 45h avec charge rapide', 'Multipoint Bluetooth 5.3']
  }
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500 selection:text-white font-sans flex flex-col relative overflow-x-hidden">
      {/* Background ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[300px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Top Navigation */}
      <Navbar />

      {/* Demo Explanation Banner */}
      <div className="border-b border-indigo-500/20 bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-indigo-950/60 px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-indigo-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              <strong>Démonstration Hybride en Direct :</strong> Testez le Chatbot IA Nova (Groq) en bas à droite, ou cliquez sur <em>« Parler à un conseiller »</em> pour voir la bascule temps réel.
            </span>
          </div>

          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono transition-colors shrink-0"
          >
            <span>Ouvrir l&apos;écran Opérateur (/admin)</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-indigo-300" />
          </Link>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-6 lg:px-8 py-16 w-full">
        {/* Hero Storefront */}
        <section className="text-center max-w-4xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-mono uppercase tracking-wider mb-6 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Équipements Pro & Support IA Hybride
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
            Matériel Haute Performance &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-300">
              Support Temps Réel
            </span>
          </h1>

          <p className="text-base sm:text-xl text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed mb-10">
            Découvrez nos équipements haut de gamme pensés pour les créateurs et développeurs. Une question sur un produit ou la livraison ? Notre assistant IA Nova vous répond immédiatement.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <Truck className="w-4 h-4 text-indigo-400" />
              <span>Livraison 24-48h offerte dès 50 €</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Garantie 2 ans échange à neuf</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <Radio className="w-4 h-4 text-amber-400" />
              <span>Support IA + Reprise Humaine 24/7</span>
            </div>
          </div>
        </section>

        {/* Product Catalog Grid */}
        <section id="produits" className="mb-24">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-xs font-mono uppercase text-indigo-400 tracking-wider">Catalogue 2026</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">Équipements Recommandés</h2>
            </div>
            <span className="text-xs text-zinc-500 font-mono hidden sm:inline">
              4 produits disponibles immédiatement
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const IconComp = product.icon;

              return (
                <div
                  key={product.id}
                  className="rounded-3xl bg-zinc-900/50 border border-white/10 p-6 flex flex-col justify-between hover:border-indigo-500/40 hover:bg-zinc-900/80 transition-all duration-300 shadow-xl group"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 group-hover:scale-110 transition-transform">
                      <IconComp className="w-6 h-6" />
                    </div>

                    <span className="text-[11px] font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 inline-block mb-3">
                      {product.tag}
                    </span>

                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                      {product.name}
                    </h3>

                    <p className="text-xs text-zinc-400 leading-relaxed mb-6 font-light">
                      {product.description}
                    </p>

                    <ul className="space-y-2 border-t border-white/5 pt-4 mb-6 text-xs text-zinc-300">
                      {product.specs.map((spec, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{spec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-zinc-500 block">Prix TTC</span>
                      <span className="text-xl font-bold text-white font-mono">{product.price}</span>
                    </div>

                    <span className="text-xs text-indigo-400 flex items-center gap-1 font-mono">
                      Stock dispo
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Technical Architecture Banner */}
        <section id="demo" className="rounded-3xl bg-gradient-to-br from-zinc-900/90 via-zinc-900/40 to-indigo-950/40 border border-white/10 p-8 sm:p-12 relative overflow-hidden shadow-2xl mb-16">
          <div className="max-w-3xl">
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 mb-3 block">
              Architecture &amp; Stack Technique
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
              Comment fonctionne cette application en temps réel ?
            </h2>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed mb-8 font-light">
              Cette démonstration illustre la puissance d&apos;une architecture hybride :
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono mb-8">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-indigo-400 font-bold block mb-1">01. IA Groq Streaming</span>
                <span className="text-zinc-400">Génération mot par mot ultra-rapide via Llama 3.3 70B sans latence.</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-amber-400 font-bold block mb-1">02. Bascule Humaine</span>
                <span className="text-zinc-400">Le visiteur clique pour alerter l&apos;opérateur avec alerte sonore en direct.</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-emerald-400 font-bold block mb-1">03. Supabase Realtime</span>
                <span className="text-zinc-400">Canal WebSocket bidirectionnel avec synchronisation sous 50ms.</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/admin"
                className="px-6 py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-gray-100 transition-all shadow-xl inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Accéder au Dashboard Opérateur</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-xs text-zinc-500 font-mono">
        Projet Démo Développé par Sedra-dev · Next.js 15 · Groq Llama 3.3 · Supabase Realtime
      </footer>

      {/* Interactive Chat Widget (Monté en permanence en bas à droite) */}
      <ChatWidget />
    </div>
  );
}
