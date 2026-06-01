import { useMemo } from "react";
import { CATEGORY_COLOR, CATEGORY_LABEL, WEEKLY_GOALS } from "@/lib/tracker/data";
import { useLocalStorage } from "@/lib/tracker/storage";

type WeeklyProgress = Record<string, number>;

export function WeeklyTab() {
  const [progress, setProgress] = useLocalStorage<WeeklyProgress>("weekly_progress", {});

  const get = (id: string) => progress[id] ?? 0;
  const set = (id: string, v: number) => setProgress((p) => ({ ...p, [id]: Math.max(0, v) }));

  const overall = useMemo(() => {
    const pcts = WEEKLY_GOALS.map((g) => Math.min(100, ((progress[g.id] ?? 0) / g.target) * 100));
    return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
  }, [progress]);

  const apps = get("w_apps");
  const steps = get("w_steps");
  const net = get("w_net");
  const vids = get("w_videos");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">This Week</h1>
        <p className="text-sm text-muted-foreground">Update progress as you go. Resets manually each Monday.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Summary label="Applications" value={apps} target={100} color="#3266ad" />
        <Summary label="Steps" value={steps} target={70000} color="#1D9E75" />
        <Summary label="Networking msgs" value={net} target={20} color="#3266ad" />
        <Summary label="Videos recorded" value={vids} target={7} color="#BA7517" />
      </div>

      <div className="card-soft p-5 space-y-3">
        {WEEKLY_GOALS.map((g) => {
          const val = get(g.id);
          const pct = Math.min(100, (val / g.target) * 100);
          return (
            <div key={g.id} className="flex flex-col sm:flex-row sm:items-center gap-3 py-2 border-b last:border-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{g.text}</span>
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: `${CATEGORY_COLOR[g.category]}1a`, color: CATEGORY_COLOR[g.category] }}
                  >
                    {CATEGORY_LABEL[g.category]}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: CATEGORY_COLOR[g.category] }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => set(g.id, val - 1)} className="size-7 rounded-md border hover:bg-muted">−</button>
                <input
                  type="number"
                  value={val}
                  onChange={(e) => set(g.id, Number(e.target.value) || 0)}
                  className="w-20 text-center text-sm border rounded-md px-2 py-1 tabular-nums"
                />
                <span className="text-xs text-muted-foreground tabular-nums">/ {g.target}</span>
                <button onClick={() => set(g.id, val + 1)} className="size-7 rounded-md border hover:bg-muted">+</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card-soft p-5 flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Weekly completion</div>
          <div className="text-3xl font-bold mt-0.5">{overall}%</div>
        </div>
        <div className="w-1/2 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${overall}%` }} />
        </div>
      </div>
    </div>
  );
}

function Summary({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = Math.min(100, (value / target) * 100);
  return (
    <div className="card-soft p-4">
      <div className="text-xs text-muted-foreground font-medium">{label}</div>
      <div className="text-xl font-bold mt-1 tabular-nums">
        {value.toLocaleString()} <span className="text-muted-foreground text-sm font-medium">/ {target.toLocaleString()}</span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
