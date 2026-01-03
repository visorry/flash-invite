'use client';

import React from 'react';
import { FEATURES } from './constants';
import { 
  Clock01Icon, 
  UserCheck01Icon, 
  Folder01Icon, 
  AnalyticsUpIcon 
} from 'hugeicons-react';

const FEATURE_ICONS = [
  Clock01Icon,
  UserCheck01Icon,
  Folder01Icon,
  AnalyticsUpIcon,
];

export const Features: React.FC = () => {
  return (
    <section id="features" className="bg-black py-24 px-4 sm:px-6 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <h2 className="font-bold text-4xl sm:text-5xl md:text-6xl text-white">
            Our <span className="text-white/60">features</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-md leading-relaxed">
            Everything you need to automate your Telegram community and start earning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, index) => {
            const Icon = FEATURE_ICONS[index] || Clock01Icon;
            return (
              <div 
                key={feature.id}
                className={`group relative bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden hover:border-emerald-400/30 transition-colors duration-300 ${
                  feature.colSpan === 2 ? 'md:col-span-2' : 'md:col-span-1'
                }`}
              >
                {/* Image Container */}
                <div className="h-64 sm:h-72 w-full overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/90 z-10" />
                  <div className="w-full h-full bg-gradient-to-br from-emerald-900/30 to-black flex items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-400/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                      <Icon size={32} className="text-emerald-400" />
                    </div>
                  </div>
                </div>

                {/* Text Content */}
                <div className="p-8 relative z-20 -mt-12">
                  <h3 className="font-bold text-3xl mb-4 text-white group-hover:text-emerald-400 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-base leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
