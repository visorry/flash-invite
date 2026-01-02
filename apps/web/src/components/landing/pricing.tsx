'use client';

import React, { useState, useEffect } from 'react';
import { LandingButton, ButtonVariant } from './button';
import { api } from '@/lib/api-client';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  type: number;
  interval: number;
  price: number;
  tokensIncluded: number;
  maxGroups: number | null;
  maxInvitesPerDay: number | null;
  features: string[];
  isActive: boolean;
}

export const LandingPricing: React.FC = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await api.plans.list();
        setPlans(data as Plan[]);
      } catch (error) {
        console.error('Failed to fetch plans:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const filteredPlans = plans.filter(plan => {
    if (isYearly) return plan.interval === 1;
    return plan.interval === 0;
  });

  const formatPrice = (price: number) => `₹${price.toLocaleString('en-IN')}`;

  return (
    <section className="bg-black py-24 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-bold text-4xl sm:text-5xl md:text-6xl mb-6">
            Simple <span className="text-white/60">pricing</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            Choose the perfect plan for your community. Start free, upgrade when you need more.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm ${!isYearly ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                isYearly ? 'bg-emerald-400' : 'bg-white/20'
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform duration-300 ${
                  isYearly ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ${isYearly ? 'text-white' : 'text-gray-500'}`}>
              Yearly <span className="text-emerald-400 text-xs">Save 20%</span>
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No plans available</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan, index) => {
              const isFeatured = index === 1;
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-3xl p-8 transition-all duration-300 ${
                    isFeatured
                      ? 'bg-emerald-400/10 border-2 border-emerald-400/50 scale-105'
                      : 'bg-white/[0.03] border border-white/10 hover:border-emerald-400/30'
                  }`}
                >
                  {isFeatured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-emerald-400 text-black text-xs font-bold px-3 py-1 rounded-full">
                        POPULAR
                      </span>
                    </div>
                  )}

                  <h3 className="font-bold text-2xl mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-6 min-h-[40px]">
                    {plan.description || 'Perfect for your needs'}
                  </p>

                  <div className="mb-6">
                    <span className="text-4xl font-bold">{formatPrice(plan.price)}</span>
                    <span className="text-gray-400 text-sm">/{isYearly ? 'year' : 'month'}</span>
                  </div>

                  <LandingButton
                    variant={isFeatured ? ButtonVariant.PRIMARY : ButtonVariant.SECONDARY}
                    href="/login?redirect=/dashboard/subscription"
                    className="w-full mb-8"
                  >
                    Get started
                  </LandingButton>

                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <svg
                          className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-400 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
