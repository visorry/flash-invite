'use client';

import { Navbar, Hero, Features, Testimonials, FAQ, LandingPricing, LandingFooter, type Plan } from '@/components/landing';
import { useSession } from '@/hooks/use-session';

interface LandingPageClientProps {
  plans: Plan[];
}

export function LandingPageClient({ plans }: LandingPageClientProps) {
  const { user } = useSession();

  return (
    <>
      <Navbar user={user} />
      
      <main className="bg-gradient-to-b from-black via-emerald-950/20 to-black">
        <Hero />
        <Features />
        <Testimonials />
        <LandingPricing plans={plans} />
        <FAQ />
      </main>

      <LandingFooter />
    </>
  );
}
