'use client';

import { useState } from 'react';
import Header from '@/components/flashinvite/header/header';
import { HeroSection } from '@/components/flashinvite/hero-section/hero-section';
import { Pricing } from '@/components/flashinvite/pricing/pricing';
import { HomePageBackground } from '@/components/gradients/home-page-background';
import { Footer } from '@/components/flashinvite/footer/footer';
import AntigravityDots from '@/components/AntigravityDots';

export default function HomePage() {
  const [country, setCountry] = useState('US');

  return (
    <>
      <div className="relative min-h-screen overflow-x-hidden">
        <AntigravityDots />
        <HomePageBackground />
        <Header user={null} />
        <HeroSection />
        <Pricing country={country} />
        <Footer />
      </div>
    </>
  );
}
