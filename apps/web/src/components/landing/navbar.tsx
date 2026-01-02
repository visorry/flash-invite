'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LandingButton, ButtonVariant } from './button';

interface NavbarProps {
  user?: any;
}

export const Navbar: React.FC<NavbarProps> = ({ user }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-4">
      <div className="w-full max-w-7xl flex justify-between items-center">
        <Link href="/" className="group flex items-center gap-2">
          <Image
            src="/favicon/icon-96x96.png"
            alt="Flash Invite Logo"
            width={32}
            height={32}
            className="rounded-lg transition-opacity hover:opacity-80"
          />
          <span className="text-xl font-bold text-white">Flash Invite</span>
        </Link>

        <div className="hidden sm:block">
          {user?.id ? (
            <LandingButton variant={ButtonVariant.PRIMARY} href="/dashboard" className="!py-2 !px-5 !text-sm">
              Dashboard
            </LandingButton>
          ) : (
            <LandingButton variant={ButtonVariant.PRIMARY} href="/login" className="!py-2 !px-5 !text-sm">
              Get Started
            </LandingButton>
          )}
        </div>
      </div>
    </nav>
  );
};
