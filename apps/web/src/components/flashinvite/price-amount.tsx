import { Tier } from '@/constants/pricing-tier';
import { cn } from '@/lib/utils';

interface Props {
  tier: Tier;
  value: string;
  priceSuffix: string;
}

const priceMap: Record<string, string> = {
  'pri_starter_month': '$9.00',
  'pri_starter_year': '$90.00',
  'pri_pro_month': '$29.00',
  'pri_pro_year': '$290.00',
  'pri_advanced_month': '$99.00',
  'pri_advanced_year': '$990.00',
};

export function PriceAmount({ tier, value, priceSuffix }: Props) {
  return (
    <div className="mt-6 flex flex-col px-8">
      <div className={cn('text-[80px] leading-[96px] tracking-[-1.6px] font-medium')}>
        {priceMap[tier.priceId[value]].replace(/\.00$/, '')}
      </div>
      <div className={cn('font-medium leading-[12px] text-[12px]')}>{priceSuffix}</div>
    </div>
  );
}
