import { CtaSection } from "@/components/landing/CtaSection";
import { FeatureBento } from "@/components/landing/FeatureBento";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LogoMarquee } from "@/components/landing/LogoMarquee";
import { RetrievalFlow } from "@/components/landing/RetrievalFlow";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteNav } from "@/components/landing/SiteNav";

export default function LandingPage() {
  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <Hero />
        <LogoMarquee />
        <HowItWorks />
        <FeatureBento />
        <RetrievalFlow />
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  );
}
