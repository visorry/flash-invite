'use client';

import { Navbar, Hero, Features, Testimonials, FAQ, LandingPricing, LandingFooter } from '@/components/landing';
import { useSession } from '@/hooks/use-session';

export default function HomePage() {
  const { user } = useSession();

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-400 selection:text-black">
      <Navbar user={user} />
      
      <main className="bg-gradient-to-b from-black via-emerald-950/20 to-black">
        <Hero />
        <Features />
        <Testimonials />
        <LandingPricing />
        <FAQ />
      </main>

      <LandingFooter />
    </div>
  );
}
