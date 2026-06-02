import { useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { CATEGORY_COLOR, CATEGORY_LABEL, DAILY_GOALS, ROADMAP_MONTHS_SHORT, TARGET_WEIGHTS, todayKey, type Category } from "@/lib/tracker/data";
import { readJSON, useLocalStorage, aggregateMetricForDates } from "@/lib/tracker/storage";

type Stats = { totalApplications: number; interviews: number; currentWeight: number; linkedinConnections: number };
type WeightLog = Array<{ month: string; weight: number }>;

const DEFAULT_STATS: Stats = { totalApplications: 0, interviews: 0, currentWeight: 85, linkedinConnections: 0 };

export function AnalyticsTab() {
  const [stats, setStats] = useLocalStorage<Stats>("analytics_stats", DEFAULT_STATS);
  const [weightLog, setWeightLog] = useLocalStorage<WeightLog>("weight_log", []);
  const [scores] = useLocalStorage<Array<{ date: string; score: number }>>("daily_scores", []);

  // Daily score trend
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const days = new Date(year, month + 1, 0).getDate();

  // Automatically calculate total applications and LinkedIn connections from all recorded scores dates
  const scoreDates = useMemo(() => scores.map((s) => s.date), [scores]);

  const computedTotalApplications = useMemo(() => {
    return aggregateMetricForDates(scoreDates, "c1", "sum", 20);
  }, [scoreDates]);

  const computedLinkedInConnections = useMemo(() => {
    return aggregateMetricForDates(scoreDates, "c3", "sum", 10);
  }, [scoreDates]);

  const trendData = useMemo(() => {
    return Array.from({ length: days }, (_, i) => {
      const d = i + 1;
      const k = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const s = scores.find((x) => x.date === k);
      return { day: d, score: s ? s.score : null };
    });
  }, [scores, year, month, days]);

  // Category completion rates over the month
  const categoryData = useMemo(() => {
    const cats: Category[] = ["career", "communication", "fitness", "mental", "discipline"];
    return cats.map((cat) => {
      const goalsInCat = DAILY_GOALS.filter((g) => g.category === cat);
      let total = 0;
      let done = 0;
      for (let d = 1; d <= now.getDate(); d++) {
        const k = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const checks = readJSON<Record<string, boolean>>(`checklist_${k}`, {});
        for (const g of goalsInCat) {
          total++;
          if (checks[g.id]) done++;
        }
      }
      const pct = total ? Math.round((done / total) * 100) : 0;
      return { category: CATEGORY_LABEL[cat], pct, color: CATEGORY_COLOR[cat] };
    });
  }, [year, month, now]);

  // Weight chart
  const weightData = useMemo(() => {
    return ROADMAP_MONTHS_SHORT.map((m, i) => {
      const log = weightLog.find((w) => w.month === m);
      return { month: m, target: TARGET_WEIGHTS[i], actual: log?.weight ?? null };
    });
  }, [weightLog]);

  const funnelData = [
    { name: "Applications", value: computedTotalApplications, fill: "#3266ad" },
    { name: "Interviews", value: stats.interviews, fill: "#1D9E75" },
  ];
  const ratio = stats.interviews ? Math.round(computedTotalApplications / stats.interviews) : 0;

  // Keep today's score reflected
  const today = todayKey();
  const trendWithToday = useMemo(() => {
    return trendData.map((p) => {
      const k = `${year}-${String(month + 1).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
      if (k === today && p.score == null) {
        const sc = scores.find((s) => s.date === today)?.score ?? null;
        return { ...p, score: sc };
      }
      return p;
    });
  }, [trendData, year, month, today, scores]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SyncedStat label="Total applications" value={computedTotalApplications} />
        <EditableStat label="Interviews received" value={stats.interviews} onChange={(v) => setStats({ ...stats, interviews: v })} />
        <EditableStat label="Current weight (kg)" value={stats.currentWeight} onChange={(v) => {
          setStats((prev) => ({ ...prev, currentWeight: v }));
          const m = ROADMAP_MONTHS_SHORT[new Date().getMonth() - 5] ?? "Jun";
          setWeightLog((prev) => [...prev.filter((p) => p.month !== m), { month: m, weight: v }]);
        }} />
        <SyncedStat label="LinkedIn connections" value={computedLinkedInConnections} />
      </div>


      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Daily Score Trend">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendWithToday}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 15]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <ReferenceLine y={8} stroke="#BA7517" strokeDasharray="4 4" label={{ value: "Min", fontSize: 10, fill: "#BA7517" }} />
              <ReferenceLine y={12} stroke="#1D9E75" strokeDasharray="4 4" label={{ value: "Excellent", fontSize: 10, fill: "#1D9E75" }} />
              <Line type="monotone" dataKey="score" stroke="#3266ad" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Category Completion Rate (this month)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip />
              <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                {categoryData.map((c, i) => <Cell key={i} fill={c.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Weight Progress (kg)">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground">Log this month:</span>
            <input
              type="number"
              placeholder="kg"
              className="border rounded px-2 py-1 text-sm w-24"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = Number((e.target as HTMLInputElement).value);
                  if (val > 0) {
                    const m = ROADMAP_MONTHS_SHORT[new Date().getMonth() - 5] ?? "Jun";
                    setWeightLog((prev) => [...prev.filter((p) => p.month !== m), { month: m, weight: val }]);
                    setStats((prev) => ({ ...prev, currentWeight: val }));
                    (e.target as HTMLInputElement).value = "";
                  }
                }
              }}
            />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[65, 90]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="target" stroke="#1D9E75" strokeDasharray="5 5" strokeWidth={2} dot={false} name="Target" />
              <Line type="monotone" dataKey="actual" stroke="#3266ad" strokeWidth={2.5} dot={{ r: 4 }} connectNulls name="Actual" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Applications vs Interviews">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="text-sm text-muted-foreground mt-2">
            {stats.interviews > 0
              ? `1 interview per ${ratio} applications`
              : "Log interviews to see your conversion ratio"}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-soft p-5">
      <h3 className="font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}

function EditableStat({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  return (
    <div className="card-soft p-4">
      <div className="text-xs text-muted-foreground font-medium">{label}</div>
      {editing ? (
        <input
          autoFocus
          type="number"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => { onChange(Number(draft) || 0); setEditing(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") { onChange(Number(draft) || 0); setEditing(false); }}}
          className="mt-1 w-full text-2xl font-bold border-b border-primary bg-transparent outline-none tabular-nums"
        />
      ) : (
        <button
          onClick={() => { setDraft(String(value)); setEditing(true); }}
          className="mt-1 text-2xl font-bold tabular-nums text-left hover:text-primary"
        >
          {value.toLocaleString()}
        </button>
      )}
    </div>
  );
}

function SyncedStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card-soft p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs text-muted-foreground font-medium">{label}</span>
          <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-emerald-500/20 shadow-sm shrink-0">
            ⚡ Synced
          </span>
        </div>
        <div className="text-2xl font-bold mt-1.5 tabular-nums text-foreground">
          {value.toLocaleString()}
        </div>
      </div>
      <div className="text-[10px] text-muted-foreground mt-2">
        Auto-computed from daily logs
      </div>
    </div>
  );
}

