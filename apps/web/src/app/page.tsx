import { Navbar, Hero, Features, Testimonials, FAQ, LandingPricing, LandingFooter, type Plan } from '@/components/landing';
import { LandingPageClient } from '@/components/landing/landing-page-client';

async function getPlans(): Promise<Plan[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${apiUrl}/api/v1/plans`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });
    
    if (!res.ok) return [];
    
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Failed to fetch plans:', error);
    return [];
  }
}

export default async function HomePage() {
  const plans = await getPlans();

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-400 selection:text-black">
      <LandingPageClient plans={plans} />
    </div>
  );
}
