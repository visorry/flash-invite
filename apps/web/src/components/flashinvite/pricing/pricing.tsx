import { Toggle } from '@/components/shared/toggle/toggle';
import { PriceCards } from '@/components/flashinvite/pricing/price-cards';
import { useState } from 'react';
import { BillingFrequency, IBillingFrequency } from '@/constants/billing-frequency';

interface Props {
  country: string;
}

// Static pricing in INR
const staticPrices: Record<string, string> = {
  'pri_01hsxyh9txq4rzbrhbyngkhy46': '₹199',
  'pri_starter_year': '₹1,990',
  'pri_01hsxycme6m95sejkz7sbz5e9g': '₹399',
  'pri_01hsxyeb2bmrg618bzwcwvdd6q': '₹3,900',
  'pri_01hsxyff091kyc9rjzx7zm6yqh': '₹999',
  'pri_01hsxyfysbzf90tkh2wqbfxwa5': '₹9,900',
};

export function Pricing({ country }: Props) {
  const [frequency, setFrequency] = useState<IBillingFrequency>(BillingFrequency[0]);

  return (
    <div className="mx-auto max-w-7xl relative px-4 sm:px-8 md:px-[32px] flex flex-col items-center justify-between py-12 sm:py-16 w-full">
      <div className="text-center mb-8 sm:mb-12 space-y-2 sm:space-y-4 w-full">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Choose Your Plan</h2>
        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2 sm:px-4">
          Perfect plan for your community. 14-day free trial included.
        </p>
      </div>
      <Toggle frequency={frequency} setFrequency={setFrequency} />
      <PriceCards frequency={frequency} loading={false} priceMap={staticPrices} />
    </div>
  );
}
