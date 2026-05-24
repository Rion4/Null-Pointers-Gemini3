"use client";

import { Navigation }        from "@/components/navigation";
import { Hero }              from "@/components/hero";
import { CursorSpotlight }   from "@/components/cursor-spotlight";
import { DarkSection }       from "@/components/dark-section";
import { TypewriterSection } from "@/components/typewriter-section";
import { Features }          from "@/components/features";
import { PricingSection }    from "@/components/pricing-section";
import { FinalCTA }          from "@/components/final-cta";
import { Footer }            from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <CursorSpotlight />
      <Navigation />
      <Hero />
      <DarkSection />
      <TypewriterSection />
      <Features />
      <PricingSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}
