'use client';

import React from 'react';
import { LandingButton, ButtonVariant } from './button';

const HERO_BG = "/hero-bg.avif";
const GRADIENT_BOTTOM = "/hero-bg.png";

export const Hero: React.FC = () => {
  return (
    <section className="relative w-full min-h-screen pt-32 sm:pt-48 flex flex-col items-center overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[800px] z-0 pointer-events-none">
        <img 
          src={HERO_BG} 
          alt="" 
          className="w-full h-full object-cover opacity-80"
          style={{ filter: 'hue-rotate(180deg) saturate(1.3)' }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-5xl px-4 sm:px-6 w-full">
        {/* Badge */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center gap-2 bg-emerald-400 text-black px-3 py-1.5 rounded-md font-mono text-[11px] font-medium tracking-widest uppercase transform hover:scale-105 transition-transform cursor-default">
            <span>TELEGRAM AUTOMATION</span>
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h1 className="font-bold text-5xl sm:text-6xl md:text-8xl text-center leading-[1.1] tracking-tight mb-8">
          <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
            Fully Automate
          </span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
            Your Telegram Groups
          </span>
        </h1>

        {/* Subtext */}
        <p className="text-gray-400 text-center text-lg sm:text-xl max-w-2xl mb-12 font-medium leading-relaxed">
          Generate subscription links, auto-approve members, and control access by time or plan. The easiest way to monetize your Telegram community.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-20 w-full sm:w-auto">
          <LandingButton href="/login" className="w-full sm:w-auto min-w-[160px]">
            Get started free
          </LandingButton>
          <LandingButton variant={ButtonVariant.SECONDARY} href="#features" className="w-full sm:w-auto min-w-[160px]">
            Learn more
          </LandingButton>
        </div>

        {/* Dashboard Image */}
        <div className="relative w-full max-w-6xl mx-auto z-10">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black/50 backdrop-blur-sm transition-transform hover:scale-[1.01] duration-700 ease-out">
            <img 
              src="/dashboard-preview.png" 
              alt="Dashboard Preview" 
              className="w-full h-auto"
            />
            
            {/* Overlay Gradient at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent"></div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[500px] z-20 pointer-events-none">
        <img 
          src={GRADIENT_BOTTOM} 
          className="w-full h-full object-cover object-top opacity-80" 
          alt="" 
          style={{ filter: 'hue-rotate(180deg) saturate(1.3)' }}
        />
      </div>

      <div className="absolute bottom-12 z-30 opacity-30 text-white font-bold uppercase tracking-widest text-sm">
        Flash Invite
      </div>
    </section>
  );
};
