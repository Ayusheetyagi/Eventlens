"use client";

import { useState } from "react";
import type { DashboardResponse, GenerateDashboardRequest } from "@/types/dashboard";
import { PreferencesForm } from "@/components/PreferencesForm";
import { LoadingState } from "@/components/LoadingState";
import { Dashboard } from "@/components/Dashboard";
import { ErrorState } from "@/components/ErrorState";
import { BlobBackground } from "@/components/BlobBackground";

type ViewState = "form" | "loading" | "results" | "error";

export function DashboardApp() {
  const [view, setView] = useState<ViewState>("form");
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [lastRequest, setLastRequest] = useState<GenerateDashboardRequest | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isRegenerating, setIsRegenerating] = useState(false);

  async function runGeneration(request: GenerateDashboardRequest, isRegenerate: boolean) {
    setLastRequest(request);
    if (isRegenerate) {
      setIsRegenerating(true);
    } else {
      setView("loading");
    }

    try {
      const res = await fetch("/api/generate-dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Something went wrong.");
      }
      setDashboard(data as DashboardResponse);
      setView("results");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
      setView("error");
    } finally {
      setIsRegenerating(false);
    }
  }

  function handleSubmit(request: GenerateDashboardRequest) {
    void runGeneration(request, false);
  }

  function handleRegenerate() {
    if (lastRequest) void runGeneration(lastRequest, true);
  }

  function handleRetry() {
    if (lastRequest) {
      void runGeneration(lastRequest, false);
    } else {
      setView("form");
    }
  }

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center gap-8 px-4 py-12">
      <BlobBackground />
      {view === "form" && <PreferencesForm onSubmit={handleSubmit} />}
      {view === "loading" && <LoadingState city={lastRequest?.city ?? ""} />}
      {view === "results" && dashboard && (
        <Dashboard dashboard={dashboard} onRegenerate={handleRegenerate} isRegenerating={isRegenerating} />
      )}
      {view === "error" && <ErrorState message={errorMessage} onRetry={handleRetry} />}
    </main>
  );
}
