export const PHASES = ["I", "II", "III", "IV", "N/A"] as const;
export type Phase = (typeof PHASES)[number];

export const STATUSES = [
  "Recruiting",
  "Active",
  "Completed",
  "Terminated",
  "Unknown",
] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_COLORS: Record<string, string> = {
  Recruiting: "bg-emerald-100 text-emerald-700",
  Active: "bg-blue-100 text-blue-700",
  Completed: "bg-gray-100 text-gray-600",
  Terminated: "bg-red-100 text-red-700",
  Unknown: "bg-amber-100 text-amber-700",
};

export const PHASE_COLORS: Record<string, string> = {
  I: "bg-primary/10 text-primary",
  II: "bg-primary/10 text-primary",
  III: "bg-primary/10 text-primary",
  IV: "bg-primary/10 text-primary",
  "N/A": "bg-gray-100 text-gray-600",
};
