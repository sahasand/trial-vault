import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

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

export interface StatusStyle {
  badge: string;
  accent: string;
  dot: string;
  pillActive: string;
  pillInactive: string;
  icon: LucideIcon;
}

export const STATUS_STYLES: Record<string, StatusStyle> = {
  Recruiting: {
    badge: "bg-emerald-100 text-emerald-700",
    accent: "border-l-emerald-500",
    dot: "text-emerald-600",
    pillActive: "bg-emerald-600 text-white border-emerald-600",
    pillInactive:
      "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50",
    icon: Users,
  },
  Active: {
    badge: "bg-blue-100 text-blue-700",
    accent: "border-l-blue-500",
    dot: "text-blue-600",
    pillActive: "bg-blue-600 text-white border-blue-600",
    pillInactive: "bg-white text-blue-700 border-blue-300 hover:bg-blue-50",
    icon: Clock,
  },
  Completed: {
    badge: "bg-gray-100 text-gray-600",
    accent: "border-l-gray-400",
    dot: "text-gray-500",
    pillActive: "bg-gray-500 text-white border-gray-500",
    pillInactive: "bg-white text-gray-600 border-gray-300 hover:bg-gray-50",
    icon: CheckCircle2,
  },
  Terminated: {
    badge: "bg-red-100 text-red-700",
    accent: "border-l-red-500",
    dot: "text-red-600",
    pillActive: "bg-red-600 text-white border-red-600",
    pillInactive: "bg-white text-red-700 border-red-300 hover:bg-red-50",
    icon: XCircle,
  },
  Unknown: {
    badge: "bg-amber-100 text-amber-700",
    accent: "border-l-amber-500",
    dot: "text-amber-600",
    pillActive: "bg-amber-500 text-white border-amber-500",
    pillInactive: "bg-white text-amber-700 border-amber-300 hover:bg-amber-50",
    icon: HelpCircle,
  },
};

export const UNKNOWN_STATUS_STYLE = STATUS_STYLES.Unknown;

export const PHASE_COLORS: Record<string, string> = {
  I: "bg-primary/10 text-primary",
  II: "bg-primary/10 text-primary",
  III: "bg-primary/10 text-primary",
  IV: "bg-primary/10 text-primary",
  "N/A": "bg-gray-100 text-gray-600",
};
