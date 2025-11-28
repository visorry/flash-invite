import { PricingTier } from '@/constants/pricing-tier';
import { IBillingFrequency } from '@/constants/billing-frequency';
import { FeaturesList } from '@/components/flashinvite/pricing/features-list';
import { PriceAmount } from '@/components/flashinvite/pricing/price-amount';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PriceTitle } from '@/components/flashinvite/pricing/price-title';
import { Separator } from '@/components/ui/separator';
import { FeaturedCardGradient } from '@/components/gradients/featured-card-gradient';
import Link from 'next/link';

interface Props {
  loading: boolean;
  frequency: IBillingFrequency;
  priceMap: Record<string, string>;
}

export function PriceCards({ loading, frequency, priceMap }: Props) {
  // Calculate savings for yearly plans
  const getSavings = (tierId: string) => {
    const savings: Record<string, { amount: string; percentage: string }> = {
      'starter': { amount: '₹398', percentage: '17%' },
      'pro': { amount: '₹888', percentage: '19%' },
      'advanced': { amount: '₹2,088', percentage: '17%' }
    };
    return savings[tierId];
  };

  return (
    <div className="w-full overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory lg:snap-none scrollbar-hide">
      <div className="isolate mx-auto flex gap-6 lg:grid lg:grid-cols-3 lg:gap-8 py-12 min-w-max lg:min-w-0 lg:max-w-none">
        {PricingTier.map((tier, index) => (
        <div 
          key={tier.id} 
          className={cn(
            'relative rounded-xl lg:rounded-2xl overflow-hidden',
            'transition-all duration-500 ease-out',
            'group cursor-pointer',
            'animate-in fade-in slide-in-from-bottom-8',
            'w-[280px] sm:w-[320px] lg:w-auto flex-shrink-0 snap-center',
            // Base card styling
            !tier.featured && 'bg-background/80 backdrop-blur-sm border border-border/50 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10',
            // Featured card styling
            tier.featured && 'bg-gradient-to-b from-emerald-500/10 via-background/90 to-background/90 backdrop-blur-md border-2 border-emerald-500/50 shadow-2xl shadow-emerald-500/20 scale-105 -my-4 z-10'
          )}
          style={{
            animationDelay: `${index * 150}ms`,
            animationFillMode: 'backwards'
          }}
        >
          {tier.featured && <FeaturedCardGradient />}
          
          <div className={cn('flex gap-4 lg:gap-6 flex-col p-5 sm:p-6 lg:p-8 pb-4 lg:pb-6')}>
            <PriceTitle tier={tier} />
            <div className="relative">
              <PriceAmount
                loading={loading}
                tier={tier}
                priceMap={priceMap}
                value={frequency.value}
                priceSuffix={frequency.priceSuffix}
              />
              {frequency.value === 'year' && (
                <div className="mt-2 inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 px-2.5 py-1 rounded-full text-xs font-medium animate-in fade-in slide-in-from-top-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="whitespace-nowrap">Save {getSavings(tier.id).amount}</span>
                </div>
              )}
            </div>
            <Separator className={cn('bg-border/50', tier.featured && 'bg-emerald-500/20')} />
            <p className={'text-[13px] sm:text-[14px] lg:text-[15px] leading-[20px] sm:leading-[21px] lg:leading-[22px] text-muted-foreground min-h-[40px] sm:min-h-[42px] lg:min-h-[44px]'}>
              {tier.description}
            </p>
          </div>
          
          <div className={'px-5 sm:px-6 lg:px-8 pb-5 sm:pb-6 lg:pb-8'}>
            <Button 
              className={cn(
                'w-full transition-all duration-300 font-semibold text-sm',
                'group-hover:scale-105 group-hover:shadow-lg',
                tier.featured 
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-500/30' 
                  : 'hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-500/50'
              )} 
              variant={tier.featured ? 'default' : 'outline'} 
              asChild={true}
            >
              <Link href={`/checkout/${tier.priceId[frequency.value]}`}>
                Get started
              </Link>
            </Button>
          </div>
          
          <FeaturesList tier={tier} />
        </div>
        ))}
      </div>
    </div>
  );
}
