import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DailyTab } from "@/components/tracker/DailyTab";
import { WeeklyTab } from "@/components/tracker/WeeklyTab";
import { MonthlyTab } from "@/components/tracker/MonthlyTab";
import { AnalyticsTab } from "@/components/tracker/AnalyticsTab";
import { CoachTab } from "@/components/tracker/CoachTab";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Transformation Tracker — 6-Month Journey" },
      { name: "description", content: "Daily, weekly, and monthly goal tracker with AI coach for a 6-month career and life transformation." },
    ],
  }),
  component: Index,
});

type TabKey = "daily" | "weekly" | "monthly" | "analytics" | "coach";

const TABS: { key: TabKey; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "analytics", label: "Analytics" },
  { key: "coach", label: "AI Coach" },
];

function Index() {
  const [tab, setTab] = useState<TabKey>("daily");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Transformation Tracker</div>
              <div className="text-sm font-semibold">Jun – Dec 2026 · 6-month journey</div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-primary" /> Day {Math.max(1, Math.ceil((Date.now() - new Date(2026, 5, 1).getTime()) / 86400000))}
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto -mx-1 px-1">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                  {active && <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-primary rounded-full" />}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 animate-in fade-in duration-300" key={tab}>
        {tab === "daily" && <DailyTab />}
        {tab === "weekly" && <WeeklyTab />}
        {tab === "monthly" && <MonthlyTab />}
        {tab === "analytics" && <AnalyticsTab />}
        {tab === "coach" && <CoachTab />}
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-8 text-center text-xs text-muted-foreground">
        Build your discipline · one day at a time
      </footer>
    </div>
  );
}
