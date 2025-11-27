import { Toggle } from '@/components/shared/toggle/toggle';
import { PriceCards } from '@/components/flashinvite/pricing/price-cards';
import { useState } from 'react';
import { BillingFrequency, IBillingFrequency } from '@/constants/billing-frequency';

interface Props {
  country: string;
}

// Static pricing (no Paddle integration for now)
const staticPrices: Record<string, string> = {
  'pri_01hsxyh9txq4rzbrhbyngkhy46': '$9.00',
  'pri_01hsxycme6m95sejkz7sbz5e9g': '$29.00',
  'pri_01hsxyeb2bmrg618bzwcwvdd6q': '$290.00',
  'pri_01hsxyff091kyc9rjzx7zm6yqh': '$99.00',
  'pri_01hsxyfysbzf90tkh2wqbfxwa5': '$990.00',
};

export function Pricing({ country }: Props) {
  const [frequency, setFrequency] = useState<IBillingFrequency>(BillingFrequency[0]);

  return (
    <div className="mx-auto max-w-7xl relative px-[32px] flex flex-col items-center justify-between">
      <Toggle frequency={frequency} setFrequency={setFrequency} />
      <PriceCards frequency={frequency} loading={false} priceMap={staticPrices} />
    </div>
  );
}
