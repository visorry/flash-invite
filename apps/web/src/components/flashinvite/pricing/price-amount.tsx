import { Tier } from '@/constants/pricing-tier';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  loading: boolean;
  tier: Tier;
  priceMap: Record<string, string>;
  value: string;
  priceSuffix: string;
}

export function PriceAmount({ loading, priceMap, priceSuffix, tier, value }: Props) {
  return (
    <div className="mt-4 sm:mt-6 flex flex-col px-0">
      {loading ? (
        <Skeleton className="h-[60px] sm:h-[80px] lg:h-[96px] w-full bg-border" />
      ) : (
        <>
          <div className={cn('text-[48px] sm:text-[64px] lg:text-[80px] leading-[56px] sm:leading-[76px] lg:leading-[96px] tracking-[-1.2px] sm:tracking-[-1.4px] lg:tracking-[-1.6px] font-medium')}>
            {priceMap[tier.priceId[value]].replace(/\.00$/, '')}
          </div>
          <div className={cn('font-medium leading-[14px] sm:leading-[12px] text-[11px] sm:text-[12px] mt-1 text-muted-foreground')}>{priceSuffix}</div>
        </>
      )}
    </div>
  );
}
