"use client";

import Link from "next/link";
import type { Trial } from "@/lib/types";
import { STATUS_COLORS } from "@/lib/constants";
import {
  Users,
  Building2,
  Target,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
} from "lucide-react";

const STATUS_ICONS: Record<string, typeof Users> = {
  Recruiting: Users,
  Active: Clock,
  Completed: CheckCircle2,
  Terminated: XCircle,
  Unknown: HelpCircle,
};

const STATUS_ACCENT: Record<string, string> = {
  Recruiting: "border-l-emerald-500",
  Active: "border-l-blue-500",
  Completed: "border-l-gray-400",
  Terminated: "border-l-red-500",
  Unknown: "border-l-amber-500",
};

function timeAgo(date: Date): string {
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

interface TrialCardProps {
  trial: Trial;
}

export default function TrialCard({ trial }: TrialCardProps) {
  const statusColor = STATUS_COLORS[trial.status] ?? STATUS_COLORS["Unknown"];
  const StatusIcon = STATUS_ICONS[trial.status] ?? HelpCircle;
  const accentColor =
    STATUS_ACCENT[trial.status] ?? "border-l-border";

  const addedDate = trial.createdAt?.toDate
    ? trial.createdAt.toDate()
    : typeof trial.createdAt === "object" &&
        "seconds" in trial.createdAt
      ? new Date((trial.createdAt as { seconds: number }).seconds * 1000)
      : null;

  const hasSampleSize = trial.sampleSize && trial.sampleSize > 0;
  const hasSponsor = !!trial.sponsor;
  const hasEndpoint = !!trial.primaryEndpoint;
  const hasDetails = hasSampleSize || hasSponsor || hasEndpoint;

  return (
    <Link href={`/trials/${trial.id}`} className="block group">
      <div
        className={`flex flex-col rounded-[10px] border border-border/60 border-l-[3px] ${accentColor} bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/40 hover:border-l-[3px] active:scale-[0.98]`}
      >
        {/* Content */}
        <div className="flex flex-col gap-2.5 p-4">
          {/* Badge row */}
          <div className="flex flex-wrap items-center gap-1.5">
            {trial.nctId && (
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-semibold tracking-wider text-primary">
                {trial.nctId}
              </span>
            )}
            {trial.phase && (
              <span className="inline-flex items-center rounded-md border border-primary/30 px-2 py-0.5 text-[10px] font-semibold text-primary">
                Phase {trial.phase}
              </span>
            )}
            {trial.status && (
              <span
                className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor}`}
              >
                <StatusIcon className="size-3" />
                {trial.status}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-[15px] font-bold leading-snug text-card-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {trial.trialName}
          </h3>

          {/* Indication */}
          {trial.indication && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {trial.indication}
            </p>
          )}

          {/* Detail items — only shown when data exists */}
          {hasDetails && (
            <div className="flex flex-col gap-1.5 pt-1">
              {/* Sample size + Sponsor row */}
              {(hasSampleSize || hasSponsor) && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {hasSampleSize && (
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-3.5 shrink-0 text-muted-foreground/50" />
                      <span className="font-medium">
                        N={trial.sampleSize.toLocaleString()}
                      </span>
                    </span>
                  )}
                  {hasSponsor && (
                    <span className="inline-flex items-center gap-1.5 min-w-0 max-w-[180px]">
                      <Building2 className="size-3.5 shrink-0 text-muted-foreground/50" />
                      <span className="truncate">{trial.sponsor}</span>
                    </span>
                  )}
                </div>
              )}
              {/* Endpoint row */}
              {hasEndpoint && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Target className="size-3.5 shrink-0 text-muted-foreground/50" />
                  <span className="truncate">{trial.primaryEndpoint}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {addedDate && (
          <div className="border-t border-border/40 px-4 py-2">
            <span className="text-[11px] text-muted-foreground/50">
              Added {timeAgo(addedDate)}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
