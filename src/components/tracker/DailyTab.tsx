import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CATEGORY_COLOR, CATEGORY_LABEL, CUSTOM_GOAL_ID, DAILY_GOALS, scoreColor, todayKey, type Category } from "@/lib/tracker/data";
import { readJSON, useLocalStorage } from "@/lib/tracker/storage";

type Checks = Record<string, boolean>;
type ScoreEntry = { date: string; score: number };

function loadChecks(date: string): Checks {
  return readJSON<Checks>(`checklist_${date}`, {});
}

export function DailyTab() {
  const date = todayKey();
  const [checks, setChecks] = useLocalStorage<Checks>(`checklist_${date}`, {});
  const [scores, setScores] = useLocalStorage<ScoreEntry[]>("daily_scores", []);
  const [customGoal, setCustomGoal] = useLocalStorage<string>("custom_goal_15", "Add your own goal here");
  const [editingCustom, setEditingCustom] = useState(false);

  const total = useMemo(() => {
    let n = 0;
    for (const g of DAILY_GOALS) if (checks[g.id]) n++;
    if (checks[CUSTOM_GOAL_ID]) n++;
    return n;
  }, [checks]);

  // Persist score for today and toast on milestones
  const [lastToasted, setLastToasted] = useState<number>(-1);
  useEffect(() => {
    setScores((prev) => {
      const others = prev.filter((s) => s.date !== date);
      return [...others, { date, score: total }].sort((a, b) => a.date.localeCompare(b.date));
    });
    if (total === 8 && lastToasted < 8) {
      toast.success("Great job! You're on track today 🎯");
      setLastToasted(8);
    } else if (total === 15 && lastToasted < 15) {
      toast.success("Perfect day! 🔥 100% complete");
      setLastToasted(15);
    }
  }, [total, date, setScores, lastToasted]);

  const toggle = (id: string) => setChecks((c) => ({ ...c, [id]: !c[id] }));

  // streak
  const streak = useMemo(() => {
    const map = new Map(scores.map((s) => [s.date, s.score]));
    let s = 0;
    const d = new Date();
    while (true) {
      const k = todayKey(d);
      const sc = map.get(k) ?? (k === date ? total : -1);
      if (sc >= 8) s++;
      else break;
      d.setDate(d.getDate() - 1);
    }
    return s;
  }, [scores, total, date]);

  // week avg (last 7 days)
  const weekAvg = useMemo(() => {
    const last7: number[] = [];
    const d = new Date();
    for (let i = 0; i < 7; i++) {
      const k = todayKey(d);
      const s = scores.find((x) => x.date === k);
      if (s) last7.push(s.score);
      else if (k === date) last7.push(total);
      d.setDate(d.getDate() - 1);
    }
    if (last7.length === 0) return 0;
    return Math.round((last7.reduce((a, b) => a + b, 0) / last7.length) * 10) / 10;
  }, [scores, total, date]);

  // month completion %
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthPct = useMemo(() => {
    let sum = 0;
    for (let d = 1; d <= now.getDate(); d++) {
      const k = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const s = scores.find((x) => x.date === k);
      if (s) sum += s.score;
      else if (k === date) sum += total;
    }
    const max = now.getDate() * 15;
    return max ? Math.round((sum / max) * 100) : 0;
  }, [scores, total, date, now]);

  const grouped: Record<Category, typeof DAILY_GOALS> = {
    career: [], communication: [], fitness: [], mental: [], discipline: [],
  };
  for (const g of DAILY_GOALS) grouped[g.category].push(g);

  const todayStr = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Today's Checklist</h1>
          <p className="text-sm text-muted-foreground">{todayStr}</p>
        </div>
        <div className="text-right">
          <div className="text-5xl font-bold tabular-nums" style={{ color: scoreColor(total) }}>
            {total} <span className="text-muted-foreground text-2xl font-medium">/ 15</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {total >= 12 ? "Excellent day" : total >= 8 ? "Passing day" : "Push harder"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Today's Score" value={`${total}/15`} accent={scoreColor(total)} />
        <MetricCard label="Current Streak" value={`${streak} day${streak === 1 ? "" : "s"}`} />
        <MetricCard label="Week Avg" value={`${weekAvg}/15`} />
        <MetricCard label="Month Completion" value={`${monthPct}%`} />
      </div>

      <div className="card-soft p-5 space-y-5">
        {(Object.keys(grouped) as Category[]).map((cat) => (
          <div key={cat}>
            <h3 className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: CATEGORY_COLOR[cat] }}>
              {CATEGORY_LABEL[cat]}
            </h3>
            <ul className="space-y-2">
              {grouped[cat].map((g) => (
                <GoalRow key={g.id} id={g.id} text={g.text} category={g.category} checked={!!checks[g.id]} onToggle={() => toggle(g.id)} />
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide mb-2 text-muted-foreground">Your custom goal</h3>
          <li className="flex items-start gap-3 list-none">
            <Checkbox checked={!!checks[CUSTOM_GOAL_ID]} onChange={() => toggle(CUSTOM_GOAL_ID)} />
            <div className="flex-1">
              {editingCustom ? (
                <input
                  autoFocus
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  onBlur={() => setEditingCustom(false)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingCustom(false)}
                  className="w-full border-b border-input bg-transparent px-1 py-0.5 outline-none focus:border-primary text-sm"
                />
              ) : (
                <button
                  onClick={() => setEditingCustom(true)}
                  className={`text-left text-sm ${checks[CUSTOM_GOAL_ID] ? "line-through text-muted-foreground" : ""}`}
                >
                  {customGoal}
                </button>
              )}
              <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mt-0.5">Custom · tap to edit</div>
            </div>
          </li>
        </div>
      </div>

      <MonthCalendar scores={scores} todayDate={date} todayScore={total} />
    </div>
  );
}

function MetricCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="card-soft p-4">
      <div className="text-xs text-muted-foreground font-medium">{label}</div>
      <div className="text-2xl font-bold mt-1 tabular-nums" style={{ color: accent ?? "inherit" }}>{value}</div>
    </div>
  );
}

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      aria-pressed={checked}
      className={`mt-0.5 size-5 shrink-0 rounded-md border flex items-center justify-center transition-all ${
        checked ? "bg-primary border-primary scale-105" : "border-input hover:border-primary/60"
      }`}
    >
      {checked && (
        <svg viewBox="0 0 20 20" className="size-3.5 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M4 10l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

function GoalRow({ text, category, checked, onToggle }: { id: string; text: string; category: Category; checked: boolean; onToggle: () => void }) {
  return (
    <li className="flex items-start gap-3">
      <Checkbox checked={checked} onChange={onToggle} />
      <div className="flex-1">
        <div className={`text-sm ${checked ? "line-through text-muted-foreground" : ""}`}>{text}</div>
        <span
          className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
          style={{ backgroundColor: `${CATEGORY_COLOR[category]}1a`, color: CATEGORY_COLOR[category] }}
        >
          {CATEGORY_LABEL[category]}
        </span>
      </div>
    </li>
  );
}

function MonthCalendar({ scores, todayDate, todayScore }: { scores: ScoreEntry[]; todayDate: string; todayScore: number }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const todayDay = now.getDate();
  const monthName = now.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const scoreFor = (day: number) => {
    const k = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (k === todayDate) return todayScore;
    const s = scores.find((x) => x.date === k);
    return s?.score ?? null;
  };

  return (
    <div className="card-soft p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{monthName} streak</h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Legend color="var(--good)" label="12+" />
          <Legend color="var(--warn)" label="8–11" />
          <Legend color="var(--bad)" label="<8" />
        </div>
      </div>
      <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-15 gap-1.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(36px,1fr))" }}>
        {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
          const s = scoreFor(d);
          const isToday = d === todayDay;
          const future = d > todayDay;
          const bg = future ? "#f3f5f9" : s == null ? "#f3f5f9" : s >= 12 ? "#dcf2e9" : s >= 8 ? "#fbecd0" : "#fadbdb";
          const fg = future ? "#9aa3b2" : s == null ? "#9aa3b2" : s >= 12 ? "#1D9E75" : s >= 8 ? "#BA7517" : "#d23a3a";
          return (
            <div
              key={d}
              title={s != null ? `Day ${d}: ${s}/15` : `Day ${d}`}
              className={`aspect-square rounded-md flex items-center justify-center text-xs font-semibold ${isToday ? "ring-2 ring-primary" : ""}`}
              style={{ backgroundColor: bg, color: fg }}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="size-2.5 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
