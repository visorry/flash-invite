import { BuiltUsingTools } from '@/components/flashinvite/footer/built-using-tools';
import { PoweredByPaddle } from '@/components/flashinvite/footer/powered-by-paddle';
import Link from 'next/link';

export function Footer() {
  return (
    <>
      <BuiltUsingTools />
      <PoweredByPaddle />
      
      {/* Main Footer Section */}
      <footer className="relative z-10 border-t border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          {/* Tagline */}
          <div className="mb-6 text-center">
            <p className="text-sm text-muted-foreground">
              Micro-payment barriers that keep your community spam-free and filled with members who truly care.
            </p>
          </div>

          {/* Footer Links */}
          <div className="flex flex-wrap justify-center gap-6 mb-6">
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link href="/legal" className="text-muted-foreground hover:text-foreground transition-colors">
                Legal
              </Link>
              <Link href="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-and-conditions" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms & Conditions
              </Link>
              <Link href="/refund-and-cancellation" className="text-muted-foreground hover:text-foreground transition-colors">
                Refund & Cancellation
              </Link>
              <Link href="/contact-us" className="text-muted-foreground hover:text-foreground transition-colors">
                Contact Us
              </Link>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2025 TwinArk Labs LLP. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
