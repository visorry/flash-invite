import { Tier } from '@/constants/pricing-tier';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface Props {
  tier: Tier;
}

export function PriceTitle({ tier }: Props) {
  const { name, featured, icon } = tier;
  return (
    <div
      className={cn('flex justify-between items-center px-0 pt-0', {
        'featured-price-title': featured,
      })}
    >
      <div className={'flex items-center gap-2 sm:gap-[10px]'}>
        <Image src={icon} height={32} width={32} className="sm:h-10 sm:w-10" alt={name} />
        <p className={'text-[17px] sm:text-[19px] lg:text-[20px] leading-[26px] sm:leading-[28px] lg:leading-[30px] font-semibold'}>{name}</p>
      </div>
      {featured && (
        <div
          className={
            'hidden sm:flex items-center px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-xs border border-secondary-foreground/10 text-[12px] sm:text-[14px] h-[24px] sm:h-[29px] leading-[18px] sm:leading-[21px] featured-card-badge'
          }
        >
          Popular
        </div>
      )}
    </div>
  );
}
