import { IBillingFrequency } from '@/constants/billing-frequency';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FeaturedCardGradient } from '@/components/gradients/featured-card-gradient';
import Link from 'next/link';

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

interface Props {
  loading: boolean;
  frequency: IBillingFrequency;
  plans: Plan[];
}

export function PriceCards({ loading, frequency, plans }: Props) {
  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="w-full text-center py-12">
        <p className="text-muted-foreground">No plans available</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory lg:snap-none scrollbar-hide">
      <div className="isolate mx-auto flex gap-6 lg:grid lg:grid-cols-3 lg:gap-8 py-12 min-w-max lg:min-w-0 lg:max-w-none">
        {plans.map((plan, index) => {
          const isFeatured = index === 1; // Middle plan is featured
          return (
          <div
            key={plan.id}
            className={cn(
              'relative rounded-xl lg:rounded-2xl overflow-hidden',
              'transition-all duration-500 ease-out',
              'group cursor-pointer',
              'animate-in fade-in slide-in-from-bottom-8',
              'w-[280px] sm:w-[320px] lg:w-auto flex-shrink-0 snap-center',
              // Base card styling
              !isFeatured && 'bg-background/80 backdrop-blur-sm border border-border/50 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10',
              // Featured card styling
              isFeatured && 'bg-gradient-to-b from-emerald-500/10 via-background/90 to-background/90 backdrop-blur-md border-2 border-emerald-500/50 shadow-2xl shadow-emerald-500/20 scale-105 -my-4 z-10'
            )}
            style={{
              animationDelay: `${index * 150}ms`,
              animationFillMode: 'backwards'
            }}
          >
            {isFeatured && <FeaturedCardGradient />}

            <div className={cn('flex gap-4 lg:gap-6 flex-col p-5 sm:p-6 lg:p-8 pb-4 lg:pb-6')}>
              {/* Plan Title */}
              <div className="flex items-center gap-3">
                <h3 className="text-xl sm:text-2xl font-bold">{plan.name}</h3>
              </div>

              {/* Price */}
              <div className="relative">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-bold">{formatPrice(plan.price)}</span>
                  <span className="text-sm text-muted-foreground">{frequency.priceSuffix}</span>
                </div>
              </div>

              <Separator className={cn('bg-border/50', isFeatured && 'bg-emerald-500/20')} />

              {/* Description */}
              <p className={'text-[13px] sm:text-[14px] lg:text-[15px] leading-[20px] sm:leading-[21px] lg:leading-[22px] text-muted-foreground min-h-[40px] sm:min-h-[42px] lg:min-h-[44px]'}>
                {plan.description || 'Perfect for your needs'}
              </p>
            </div>

            <div className={'px-5 sm:px-6 lg:px-8 pb-5 sm:pb-6 lg:pb-8'}>
              <Button
                className={cn(
                  'w-full transition-all duration-300 font-semibold text-sm',
                  'group-hover:scale-105 group-hover:shadow-lg',
                  isFeatured
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-md shadow-emerald-500/30'
                    : 'hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-500/50'
                )}
                variant={isFeatured ? 'default' : 'outline'}
                asChild={true}
              >
                <Link href={`/login?redirect=/dashboard/subscription`}>
                  Get started
                </Link>
              </Button>
            </div>

            {/* Features List */}
            <div className="px-5 sm:px-6 lg:px-8 pb-5 sm:pb-6 lg:pb-8">
              <ul className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
        })}
      </div>
    </div>
  );
}
