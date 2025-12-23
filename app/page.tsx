"use client";

import { Header } from "@/components/ui/header";
import { HeroSection } from "@/components/ui/hero-section";
import { RandomGenerator } from "@/components/ui/random-generator";
import { RestaurantGrid } from "@/components/ui/restaurant-grid";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pb-16">
        <HeroSection />
        {/* <RandomGenerator /> */}
        {/* <RestaurantGrid searchQuery="" category={null} /> */}
      </main>
    </div>
  );
}
