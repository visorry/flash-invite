'use client'

import { Toggle } from '@/components/shared/toggle/toggle';
import { PriceCards } from '@/components/flashinvite/pricing/price-cards';
import { useState, useEffect } from 'react';
import { BillingFrequency, IBillingFrequency } from '@/constants/billing-frequency';
import { api } from '@/lib/api-client';

interface Props {
  country: string;
}

interface Plan {
  id: string;
  name: string;
  description: string | null;
  type: number;
  interval: number; // 0: MONTHLY, 1: YEARLY, 2: LIFETIME
  price: number;
  tokensIncluded: number;
  maxGroups: number | null;
  maxInvitesPerDay: number | null;
  features: string[];
  isActive: boolean;
}

export function Pricing({ country }: Props) {
  const [frequency, setFrequency] = useState<IBillingFrequency>(BillingFrequency[0]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await api.plans.list() as Plan[];
        setPlans(data);
      } catch (error) {
        console.error('Failed to fetch plans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // Filter plans based on selected frequency
  const filteredPlans = plans.filter(plan => {
    if (frequency.value === 'month') {
      return plan.interval === 0; // MONTHLY
    } else {
      return plan.interval === 1; // YEARLY
    }
  });

  return (
    <div className="mx-auto max-w-7xl relative px-4 sm:px-8 md:px-[32px] flex flex-col items-center justify-between py-12 sm:py-16 w-full">
      <div className="text-center mb-8 sm:mb-12 space-y-2 sm:space-y-4 w-full">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Choose Your Plan</h2>
        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2 sm:px-4">
          Perfect plan for your community. 14-day free trial included.
        </p>
      </div>
      <Toggle frequency={frequency} setFrequency={setFrequency} />
      <PriceCards frequency={frequency} loading={loading} plans={filteredPlans} />
    </div>
  );
}
