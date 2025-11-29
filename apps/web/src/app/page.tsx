'use client';

import { useState } from 'react';
import Header from '@/components/flashinvite/header/header';
import { HeroSection } from '@/components/flashinvite/hero-section/hero-section';
import { Pricing } from '@/components/flashinvite/pricing/pricing';
import { HomePageBackground } from '@/components/gradients/home-page-background';
import { Footer } from '@/components/flashinvite/footer/footer';
import AntigravityDots from '@/components/AntigravityDots';
import { useSession } from '@/hooks/use-session';

export default function HomePage() {
  const [country, setCountry] = useState('US');
  const { user } = useSession();

  return (
    <>
      <div className="relative min-h-screen overflow-x-hidden">
        <AntigravityDots />
        <HomePageBackground />
        <Header user={user} />
        <HeroSection />
        <Pricing country={country} />
        <Footer />
      </div>
    </>
  );
}
