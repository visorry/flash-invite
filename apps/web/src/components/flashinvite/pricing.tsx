import { Toggle } from '@/components/flashinvite/toggle';
import { PriceCards } from '@/components/flashinvite/price-cards';
import { useState } from 'react';
import { BillingFrequency, IBillingFrequency } from '@/constants/billing-frequency';

export function Pricing() {
  const [frequency, setFrequency] = useState<IBillingFrequency>(BillingFrequency[0]);

  return (
    <div className="mx-auto max-w-7xl relative px-[32px] flex flex-col items-center justify-between">
      <Toggle frequency={frequency} setFrequency={setFrequency} />
      <PriceCards frequency={frequency} />
    </div>
  );
}
