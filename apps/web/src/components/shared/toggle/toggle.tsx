import { BillingFrequency, IBillingFrequency } from '@/constants/billing-frequency';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Props {
  frequency: IBillingFrequency;
  setFrequency: (frequency: IBillingFrequency) => void;
}

export function Toggle({ setFrequency, frequency }: Props) {
  return (
    <div className="flex justify-center mb-12 relative">
      <Tabs
        value={frequency.value}
        onValueChange={(value) =>
          setFrequency(BillingFrequency.find((billingFrequency) => value === billingFrequency.value)!)
        }
      >
        <TabsList className="relative bg-muted/50 backdrop-blur-sm p-1 h-12">
          {BillingFrequency.map((billingFrequency) => (
            <TabsTrigger 
              key={billingFrequency.value} 
              value={billingFrequency.value}
              className="relative px-8 transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:scale-105"
            >
              <span className="relative z-10 font-medium">
                {billingFrequency.label}
              </span>
              {billingFrequency.value === 'year' && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-600 to-green-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg animate-bounce">
                  Save 17%
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
