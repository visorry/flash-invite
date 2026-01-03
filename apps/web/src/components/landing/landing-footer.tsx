'use client';

import React from 'react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-black border-t border-white/10 py-12 px-4">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
        
        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-gray-400 text-sm sm:text-base">
          <a href="/legal" className="hover:text-white transition-colors">Legal</a>
          <span className="text-white/20">•</span>
          <a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a>
          <span className="text-white/20">•</span>
          <a href="/terms-and-conditions" className="hover:text-white transition-colors">Terms</a>
          <span className="text-white/20">•</span>
          <a href="/contact-us" className="hover:text-white transition-colors">Contact</a>
        </div>

        {/* Copyright */}
        <div className="flex items-center gap-1 text-gray-400 text-sm">
          <span>© 2025</span>
          <span className="text-white font-medium hover:text-emerald-400 transition-colors">Flash Invite</span>
          <span>by TwinArk Labs LLP</span>
        </div>

      </div>
    </footer>
  );
};
