import { CTASection } from '@/features/landing/components/CTASection';
import { FeaturesSection } from '@/features/landing/components/FeaturesSection';
import { HeroSection } from '@/features/landing/components/HeroSection';
import { PricingSection } from '@/features/landing/components/PricingSection';
import { TestimonialsSection } from '@/features/landing/components/TestimonialsSection';

/** Landing pública de MediPlan. */
function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
    </>
  );
}

export { LandingPage };
