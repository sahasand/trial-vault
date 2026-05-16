import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Trial } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Firestore Timestamps lose their methods when serialized through NextResponse.json,
// arriving on the client as { seconds, nanoseconds }. Handle both shapes.
export function firestoreTimestampToDate(ts: unknown): Date | null {
  if (!ts || typeof ts !== "object") return null;
  const obj = ts as { toDate?: () => Date; seconds?: number };
  if (typeof obj.toDate === "function") return obj.toDate();
  if (typeof obj.seconds === "number") return new Date(obj.seconds * 1000);
  return null;
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

export type SyncSeverity = "fresh" | "aging" | "stale";

export function getSyncAge(lastSyncedAt: unknown): {
  days: number | null;
  severity: SyncSeverity;
} {
  const date = firestoreTimestampToDate(lastSyncedAt);
  if (!date) return { days: null, severity: "fresh" };
  const days = (Date.now() - date.getTime()) / 86_400_000;
  const severity: SyncSeverity =
    days > 90 ? "stale" : days > 30 ? "aging" : "fresh";
  return { days, severity };
}

const CSV_COLUMNS: { key: keyof Trial; label: string }[] = [
  { key: "nctId", label: "NCT ID" },
  { key: "trialName", label: "Display Name" },
  { key: "officialTitle", label: "Official Title" },
  { key: "phase", label: "Phase" },
  { key: "status", label: "Status" },
  { key: "sampleSize", label: "Sample Size" },
  { key: "sponsor", label: "Sponsor" },
  { key: "indication", label: "Indication" },
  { key: "primaryEndpoint", label: "Primary Endpoint" },
  { key: "notes", label: "Notes" },
  { key: "lastSyncedAt", label: "Last Synced" },
  { key: "createdAt", label: "Created" },
];

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  let str: string;
  if (typeof value === "object") {
    const date = firestoreTimestampToDate(value);
    str = date ? date.toISOString() : "";
  } else {
    str = String(value);
  }
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function trialsToCSV(trials: Trial[]): string {
  const header = CSV_COLUMNS.map((c) => csvEscape(c.label)).join(",");
  const rows = trials.map((t) =>
    CSV_COLUMNS.map((c) => csvEscape(t[c.key])).join(",")
  );
  return [header, ...rows].join("\r\n");
}

export function downloadCSV(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
