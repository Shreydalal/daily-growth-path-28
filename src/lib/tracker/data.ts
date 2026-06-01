export type Category = "career" | "communication" | "fitness" | "mental" | "discipline";

export const CATEGORY_LABEL: Record<Category, string> = {
  career: "Career",
  communication: "Communication",
  fitness: "Fitness",
  mental: "Mental",
  discipline: "Discipline",
};

export const CATEGORY_COLOR: Record<Category, string> = {
  career: "#3266ad",
  communication: "#BA7517",
  fitness: "#1D9E75",
  mental: "#533ab7",
  discipline: "#533ab7",
};

export interface DailyGoal {
  id: string;
  text: string;
  category: Category;
}

export const DAILY_GOALS: DailyGoal[] = [
  { id: "c1", text: "Apply to 20 jobs", category: "career" },
  { id: "c2", text: "Send 3 networking messages", category: "career" },
  { id: "c3", text: "Connect with 10 professionals on LinkedIn", category: "career" },
  { id: "c4", text: "1 hour interview preparation", category: "career" },
  { id: "c5", text: "1 hour portfolio / project improvement", category: "career" },
  { id: "co1", text: "Record 1 AI/ML video explanation (3–5 min)", category: "communication" },
  { id: "co2", text: "Practice 3 HR interview questions", category: "communication" },
  { id: "f1", text: "Complete morning cardio (6:15 AM session)", category: "fitness" },
  { id: "f2", text: "Walk 8,000+ steps", category: "fitness" },
  { id: "f3", text: "Drink 3+ litres of water", category: "fitness" },
  { id: "m1", text: "Journal for 10 minutes", category: "mental" },
  { id: "m2", text: "Read 10 pages", category: "mental" },
  { id: "m3", text: "Meditation / Mindfulness (10 minutes)", category: "mental" },
  { id: "d1", text: "Sleep before 10:30 PM", category: "discipline" },
  { id: "d2", text: "No social media during career blocks", category: "discipline" },
];


export interface WeeklyGoal {
  id: string;
  text: string;
  category: Category;
  target: number;
  unit?: string;
}

export const WEEKLY_GOALS: WeeklyGoal[] = [
  { id: "w_apps", text: "Job applications", category: "career", target: 100 },
  { id: "w_net", text: "Networking messages", category: "career", target: 20 },
  { id: "w_li", text: "New LinkedIn connections", category: "career", target: 70 },
  { id: "w_mock", text: "Mock interviews", category: "career", target: 2 },
  { id: "w_resume", text: "Resume improvements", category: "career", target: 1 },
  { id: "w_videos", text: "Videos recorded", category: "communication", target: 7 },
  { id: "w_hr", text: "Mock HR interviews", category: "communication", target: 1 },
  { id: "w_workout", text: "Workouts (days)", category: "fitness", target: 6 },
  { id: "w_steps", text: "Steps", category: "fitness", target: 70000 },
  { id: "w_weight", text: "Weight lost (kg ×10)", category: "fitness", target: 10 },
  { id: "w_journal", text: "Journal entries", category: "mental", target: 7 },
  { id: "w_break", text: "Half-day career break", category: "mental", target: 1 },
];

export interface MonthlyGoal {
  id: string;
  text: string;
  target: number;
}

export const JUNE_MONTHLY_GOALS: MonthlyGoal[] = [
  { id: "m_apps", text: "Job applications", target: 400 },
  { id: "m_li", text: "LinkedIn connections", target: 300 },
  { id: "m_rec", text: "Recruiter conversations", target: 10 },
  { id: "m_int", text: "Interview calls", target: 10 },
  { id: "m_proj", text: "Deployed projects", target: 1 },
  { id: "m_kg", text: "kg lost (×10)", target: 30 },
  { id: "m_work", text: "Workouts completed", target: 24 },
  { id: "m_steps", text: "Steps walked", target: 250000 },
  { id: "m_vid", text: "Videos recorded", target: 30 },
  { id: "m_mock", text: "Mock interviews", target: 5 },
];

export interface RoadmapMonth {
  month: string;
  theme: string;
  goal: string;
  weight: string;
}

export const ROADMAP: RoadmapMonth[] = [
  { month: "June", theme: "Job Acquisition", goal: "Land first job", weight: "85 → 82 kg" },
  { month: "July", theme: "Secure Employment", goal: "Reach final rounds / first offer", weight: "82 → 80 kg" },
  { month: "August", theme: "Excellence", goal: "Top performer at new job", weight: "80 → 78 kg" },
  { month: "September", theme: "Growth", goal: "Build production AI project", weight: "78 → 76 kg" },
  { month: "October", theme: "Positioning", goal: "Pick specialisation, build flagship project", weight: "76 → 74 kg" },
  { month: "November", theme: "Upgrade", goal: "Prepare for better-paying role", weight: "74 → 72 kg" },
  { month: "December", theme: "Transformation", goal: "₹25k–₹50k+/month, 1000+ LinkedIn connections", weight: "72 kg" },
];

export const TARGET_WEIGHTS = [85, 82, 80, 78, 76, 74, 72];
export const ROADMAP_MONTHS_SHORT = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function scoreColor(score: number) {
  if (score >= 12) return "var(--good)";
  if (score >= 8) return "var(--warn)";
  return "var(--bad)";
}
