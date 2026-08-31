"use client";

import { AuthGuard } from "@/lib/AuthGuard";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { DashboardHome } from "@/components/dashboard/DashboardHome";

export default function AppDashboardPage() {
  return (
    <AuthGuard>
      <DashboardHome />
      <OnboardingTour />
    </AuthGuard>
  );
}
