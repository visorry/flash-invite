'use client';

import React, { useState } from 'react';
import { FAQS } from './constants';
import { Plus } from 'lucide-react';

export const FAQ: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>("q1");

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="bg-black py-24 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-bold text-4xl sm:text-5xl md:text-6xl mb-6">
            Frequently asked <span className="text-white/60">questions</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Everything you need to know about Flash Invite.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {FAQS.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div 
                key={faq.id}
                onClick={() => toggle(faq.id)}
                className={`
                  border border-white/10 rounded-2xl p-6 cursor-pointer transition-all duration-300
                  ${isOpen ? 'bg-white/[0.05]' : 'bg-transparent hover:bg-white/[0.02]'}
                `}
              >
                <div className="flex justify-between items-center w-full">
                  <h3 className="font-bold text-xl sm:text-2xl text-left pr-8">
                    {faq.question}
                  </h3>
                  <div className={`
                    w-10 h-10 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-300
                    ${isOpen ? 'bg-emerald-400 border-emerald-400 text-black' : 'border-white/20 text-white'}
                  `}>
                    <Plus className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
                  </div>
                </div>
                
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-gray-400 leading-relaxed max-w-2xl">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
