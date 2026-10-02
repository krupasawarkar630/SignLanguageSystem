"use client";

import React from"react";
import {
 Hero,
 HowItWorksSection,
 FeaturesSection,
 PrivacySection,
 FAQSection,
 ClosingCTASection,
} from"@/components/home";

export default function HomePage() {
 return (
 <div className="space-y-0 pb-20 bg-gestura-bg">
 {/* 01. Hero with HandAnalysisVisual */}
 <Hero />

 {/* 02. How It Works: Hand → Gesture → Words → Voice */}
 <div className="py-20 sm:py-28 bg-gestura-bg-secondary">
 <HowItWorksSection />
 </div>

 {/* 03. Features Grid: 6 real features */}
 <div className="py-20 sm:py-28">
 <FeaturesSection />
 </div>

 {/* 04. Trust & Privacy Band */}
 <div className="py-20 sm:py-28 bg-gestura-bg">
 <PrivacySection />
 </div>

 {/* 05. FAQ */}
 <div className="py-20 sm:py-28 bg-gestura-bg-secondary">
 <FAQSection />
 </div>

 {/* 06. Closing CTA */}
 <div className="pt-20 sm:pt-28">
 <ClosingCTASection />
 </div>
 </div>
 );
}
