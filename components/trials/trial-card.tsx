"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Trial } from "@/lib/types";
import { STATUS_STYLES, UNKNOWN_STATUS_STYLE } from "@/lib/constants";
import { firestoreTimestampToDate, getSyncAge, timeAgo } from "@/lib/utils";
import { ctgovStudyUrl } from "@/lib/ctgov";
import { trialFilterHref } from "@/lib/hooks";
import { Users, Building2, Target, ExternalLink } from "lucide-react";

interface TrialCardProps {
  trial: Trial;
}

export default function TrialCard({ trial }: TrialCardProps) {
  const router = useRouter();
  const style = STATUS_STYLES[trial.status] ?? UNKNOWN_STATUS_STYLE;
  const StatusIcon = style.icon;
  const accentColor = trial.status ? style.accent : "border-l-border";

  const addedDate = firestoreTimestampToDate(trial.createdAt);
  const sync = getSyncAge(trial.lastSyncedAt);

  const hasSampleSize = trial.sampleSize && trial.sampleSize > 0;
  const hasSponsor = !!trial.sponsor;
  const hasEndpoint = !!trial.primaryEndpoint;
  const hasDetails = hasSampleSize || hasSponsor || hasEndpoint;

  function pushFilter(patch: { sponsor?: string; indication?: string }) {
    return (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      router.push(trialFilterHref(patch));
    };
  }

  function openCtgov(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    window.open(ctgovStudyUrl(trial.nctId), "_blank", "noopener,noreferrer");
  }

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
              <button
                type="button"
                onClick={openCtgov}
                title="Open on ClinicalTrials.gov"
                className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-semibold tracking-wider text-primary hover:bg-primary/20 transition-colors"
              >
                {trial.nctId}
                <ExternalLink className="size-2.5 opacity-60" />
              </button>
            )}
            {trial.phase && (
              <span className="inline-flex items-center rounded-md border border-primary/30 px-2 py-0.5 text-[10px] font-semibold text-primary">
                Phase {trial.phase}
              </span>
            )}
            {trial.status && (
              <span
                className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.badge}`}
              >
                <StatusIcon className="size-3" />
                {trial.status}
              </span>
            )}
            {sync.severity === "stale" && (
              <span
                className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700"
                title={`Last synced ${Math.round(sync.days ?? 0)} days ago`}
              >
                Stale
              </span>
            )}
            {sync.severity === "aging" && (
              <span
                className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700"
                title={`Last synced ${Math.round(sync.days ?? 0)} days ago`}
              >
                Aging
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-[15px] font-bold leading-snug text-card-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {trial.trialName}
          </h3>

          {/* Indication */}
          {trial.indication && (
            <button
              type="button"
              onClick={pushFilter({ indication: trial.indication })}
              title={`Filter by ${trial.indication}`}
              className="text-left text-xs text-muted-foreground hover:text-primary hover:underline underline-offset-2 line-clamp-1"
            >
              {trial.indication}
            </button>
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
                    <button
                      type="button"
                      onClick={pushFilter({ sponsor: trial.sponsor })}
                      title={`Filter by ${trial.sponsor}`}
                      className="inline-flex items-center gap-1.5 min-w-0 max-w-[180px] hover:text-primary transition-colors"
                    >
                      <Building2 className="size-3.5 shrink-0 text-muted-foreground/50" />
                      <span className="truncate hover:underline underline-offset-2">
                        {trial.sponsor}
                      </span>
                    </button>
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
