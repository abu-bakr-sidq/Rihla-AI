'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Zap, ShieldCheck } from 'lucide-react';

const HUD_STATS = [
  { value: '$14,285', label: 'TRIP VALUATION',   badge: 'LIVE',       badgeColor: '#D4AF37' },
  { value: '99.99%',  label: 'BUDGET PRECISION', badge: '+0.01%',     badgeColor: '#10b981' },
  { value: '15.4%',   label: 'SAVINGS YIELD',    badge: '+2.1%',      badgeColor: '#3b82f6' },
  { value: '985%',    label: 'NODE EFFICIENCY',  badge: 'SYNCING',    badgeColor: '#a855f7' },
];

const FEATURES = [
  { Icon: Globe,       title: 'Global Coverage',       desc: 'Live intelligence across 55+ destinations worldwide with real-time climate sync.' },
  { Icon: Zap,         title: 'Instant Processing',    desc: 'Sub-100ms AI inference on complex multi-variable travel optimization models.' },
  { Icon: ShieldCheck, title: 'Encrypted Privacy',     desc: 'End-to-end encrypted sessions with zero data retention after trip generation.' },
];

export function WhoobeeAnalysis() {
  return (
    <section className="w-full py-8">
      <div className="container mx-auto px-6 md:px-10 max-w-7xl">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-14"
        >
          <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-none text-foreground">
            AI{' '}
            <span style={{ color: '#D4AF37' }}>ANALYTICS</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-4 max-w-lg mx-auto leading-relaxed">
            Our AI engines audit your travel registry in real-time, delivering deterministic valuations with
            high fiscal fidelity.
          </p>
        </motion.div>

        {/* ── 4 HUD stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {HUD_STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative p-6 rounded-2xl backdrop-blur-md overflow-hidden group hover:-translate-y-1 transition-transform duration-300"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* Live badge top right */}
              <span
                className="absolute top-4 right-4 text-[8px] font-black uppercase tracking-[0.3em] px-2 py-0.5 rounded-full"
                style={{ background: `${s.badgeColor}22`, color: s.badgeColor }}
              >
                {s.badge}
              </span>

              {/* Subtle sparkline decoration */}
              <div className="mb-4 opacity-20">
                <svg width="60" height="18" viewBox="0 0 60 18" fill="none">
                  <polyline points="0,14 10,10 20,12 30,6 40,8 50,3 60,6"
                    stroke={s.badgeColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
              </div>

              <p className="text-3xl md:text-4xl font-black tracking-tight text-foreground mb-1">{s.value}</p>
              <p className="text-[8px] font-black uppercase tracking-[0.4em]" style={{ color: 'rgba(212,175,55,0.5)' }}>{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* ── 3 feature rows ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className="flex items-start gap-4 p-5 rounded-2xl backdrop-blur-sm group"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.15)' }}
              >
                <f.Icon className="w-4 h-4" style={{ color: '#D4AF37' }} />
              </div>
              <div>
                <h4 className="text-sm font-black text-foreground mb-1 group-hover:text-[#D4AF37] transition-colors">{f.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default WhoobeeAnalysis;
