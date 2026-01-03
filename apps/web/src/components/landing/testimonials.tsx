'use client';

import React, { useRef } from 'react';
import { TESTIMONIALS } from './constants';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const Testimonials: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="bg-black py-24 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <h2 className="font-bold text-4xl sm:text-5xl md:text-6xl text-center mb-6">
          What our users are <span className="text-white/60">saying</span>
        </h2>
        <p className="text-gray-400 text-center max-w-2xl mb-16 text-lg">
          Join thousands of community managers who trust Flash Invite.
        </p>

        {/* Scroll Container */}
        <div 
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto w-full pb-12 snap-x snap-mandatory scrollbar-hide"
        >
          {TESTIMONIALS.map((t) => (
            <div 
              key={t.id}
              className="flex-shrink-0 w-full sm:w-[400px] md:w-[600px] snap-center bg-white/[0.03] border border-white/10 rounded-3xl p-8 sm:p-10 flex flex-col justify-between h-[400px] hover:border-emerald-400/30 transition-all duration-300"
            >
              <div className="flex flex-col gap-8">
                <div className="w-12 h-12 rounded-full bg-emerald-400/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                  </svg>
                </div>
                <p className="text-xl sm:text-2xl font-bold leading-tight text-white">
                  {t.quote}
                </p>
              </div>

              <div className="flex items-center gap-4 mt-auto">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 bg-emerald-400/20 flex items-center justify-center">
                  <span className="text-emerald-400 font-bold text-lg">{t.authorName.charAt(0)}</span>
                </div>
                <div>
                  <h4 className="font-medium text-white">{t.authorName}</h4>
                  <p className="text-sm text-gray-400">{t.authorRole}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex gap-4 mt-8">
          <button 
            onClick={() => scroll('left')}
            className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-emerald-400 hover:text-black hover:border-emerald-400 transition-colors"
            aria-label="Previous testimonial"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-emerald-400 hover:text-black hover:border-emerald-400 transition-colors"
            aria-label="Next testimonial"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};
