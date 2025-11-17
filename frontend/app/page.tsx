"use client";
import RiskDashboard from "@/components/risk-dashboard";
import { HeroUIProvider } from "@heroui/react";

export default function Home() {
  return (
    <HeroUIProvider>
      <main className="min-h-screen bg-background text-foreground">
        <RiskDashboard />
      </main>
    </HeroUIProvider>
  );
}
