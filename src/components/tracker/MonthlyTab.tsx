import { useState, useMemo } from "react";
import { JUNE_MONTHLY_GOALS, ROADMAP, MONTHLY_AUTO_CALC, getMonthDates, getWeeksForMonth } from "@/lib/tracker/data";
import { useLocalStorage, aggregateMetricForDates } from "@/lib/tracker/storage";

type MonthlyProgress = Record<string, number>;

export function MonthlyTab() {
  const [progress, setProgress] = useLocalStorage<MonthlyProgress>("monthly_progress", {});
  const [weeklyProgress] = useLocalStorage<Record<string, Record<string, number>>>("weekly_progress", {});
  const [analyticsStats] = useLocalStorage<any>("analytics_stats", { interviews: 0 });
  
  const now = new Date();
  const monthIdx = now.getMonth(); // 5 = June for current month logic
  const currentRoadmapIdx = Math.max(0, monthIdx - 5); // June = 0

  // Generate date strings for the current month
  const monthDates = useMemo(() => getMonthDates(now), [now.getFullYear(), now.getMonth()]);

  // Find all calendar weeks overlapping with the current month
  const monthWeeks = useMemo(() => getWeeksForMonth(now), [now.getFullYear(), now.getMonth()]);

  // Compute calculated progress, merging manual entries, weekly progress syncs, and auto-calculated values
  const get = (id: string) => {
    // 1. Check if it's auto-calculated from daily checklist
    const autoDef = MONTHLY_AUTO_CALC[id];
    if (autoDef) {
      return aggregateMetricForDates(monthDates, autoDef.dailyId, autoDef.type, autoDef.dailyTarget);
    }

    // 2. Sync from weekly manual entries
    if (id === "m_mock") {
      return monthWeeks.reduce((sum, wk) => sum + ((weeklyProgress[wk] ?? {})["w_mock"] ?? 0), 0);
    }
    if (id === "m_kg") {
      return monthWeeks.reduce((sum, wk) => sum + ((weeklyProgress[wk] ?? {})["w_weight"] ?? 0), 0);
    }

    // Sync from analytics tab
    if (id === "m_int") {
      return analyticsStats.interviews ?? 0;
    }

    // 3. Fallback to manual monthly entry
    return progress[id] ?? 0;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{now.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h1>
        <p className="text-sm text-muted-foreground">6-month transformation roadmap</p>
      </div>

      <div className="card-soft p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Current Month</div>
            <div className="text-xl font-bold mt-0.5">Job Acquisition Month</div>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded-md bg-primary/10 text-primary">Month 1 of 6</span>
        </div>

        <div className="space-y-3">
          {JUNE_MONTHLY_GOALS.map((g) => {
            const isAuto = !!MONTHLY_AUTO_CALC[g.id] || g.id === "m_mock" || g.id === "m_kg" || g.id === "m_int";
            return (
              <MonthlyRow
                key={g.id}
                label={g.text}
                target={g.target}
                value={get(g.id)}
                isAuto={isAuto}
                onChange={isAuto ? undefined : (v) => setProgress((p) => ({ ...p, [g.id]: v }))}
              />
            );
          })}
        </div>
      </div>

      <div className="card-soft p-5">
        <h3 className="font-semibold mb-4">6-Month Roadmap</h3>
        <ol className="relative border-l-2 border-border ml-2 space-y-5">
          {ROADMAP.map((m, i) => {
            const status = i < currentRoadmapIdx ? "completed" : i === currentRoadmapIdx ? "active" : "upcoming";
            return (
              <li key={m.theme} className="ml-5">
                <span
                  className={`absolute -left-[9px] size-4 rounded-full border-2 ${
                    status === "completed" ? "bg-good border-good" : status === "active" ? "bg-primary border-primary" : "bg-background border-border"
                  }`}
                  style={{
                    backgroundColor: status === "completed" ? "var(--good)" : status === "active" ? "var(--primary)" : "var(--background)",
                    borderColor: status === "completed" ? "var(--good)" : status === "active" ? "var(--primary)" : "var(--border)",
                  }}
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{m.month}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">{m.theme}</span>
                  {status === "active" && <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">In Progress</span>}
                  {status === "completed" && <span className="text-xs px-1.5 py-0.5 rounded text-white font-semibold" style={{ backgroundColor: "var(--good)" }}>Completed</span>}
                </div>
                <div className="text-sm mt-1">{m.goal}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Weight: {m.weight}</div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function MonthlyRow({
  label,
  target,
  value,
  isAuto,
  onChange,
}: {
  label: string;
  target: number;
  value: number;
  isAuto?: boolean;
  onChange?: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const pct = Math.min(100, (value / target) * 100);
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          {isAuto && (
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-500/20">
              ⚡ Synced
            </span>
          )}
        </div>
        {isAuto ? (
          <div className="text-sm tabular-nums text-emerald-600 font-bold">
            {value.toLocaleString()} <span className="text-xs text-muted-foreground font-normal">/ {target.toLocaleString()}</span>
          </div>
        ) : editing && onChange ? (
          <input
            autoFocus
            type="number"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => { onChange(Number(draft) || 0); setEditing(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") { onChange(Number(draft) || 0); setEditing(false); }}}
            className="w-24 text-right text-sm border rounded px-2 py-0.5 tabular-nums bg-transparent"
          />
        ) : (
          <button
            onClick={() => { setDraft(String(value)); setEditing(true); }}
            className="text-sm tabular-nums text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <span className="font-semibold text-foreground">{value.toLocaleString()}</span> / {target.toLocaleString()}
          </button>
        )}
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
