"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Trial } from "@/lib/types";
import TrialCard from "@/components/trials/trial-card";
import TrialFilters from "@/components/trials/trial-filters";
import SearchBar from "@/components/ui/search-bar";
import ErrorBanner from "@/components/ui/error-banner";
import {
  STATUS_STYLES,
  UNKNOWN_STATUS_STYLE,
} from "@/lib/constants";
import { useTrialFilters, type SortValue } from "@/lib/hooks";
import { firestoreTimestampToDate, trialsToCSV, downloadCSV } from "@/lib/utils";
import { Plus, FlaskConical, Download } from "lucide-react";

function SkeletonCard() {
  return (
    <div className="rounded-[10px] border border-border/60 bg-card p-4 shadow-sm animate-pulse">
      <div className="flex gap-2 mb-3">
        <div className="h-5 w-24 rounded-md bg-muted" />
        <div className="h-5 w-16 rounded-md bg-muted" />
      </div>
      <div className="h-5 w-3/4 rounded-md bg-muted mb-3" />
      <div className="h-4 w-1/2 rounded-md bg-muted mb-2" />
      <div className="h-4 w-1/3 rounded-md bg-muted mb-4" />
      <div className="h-5 w-20 rounded-full bg-muted" />
    </div>
  );
}

function sortTrials(trials: Trial[], sort: SortValue): Trial[] {
  const copy = [...trials];
  switch (sort) {
    case "updated":
      return copy.sort((a, b) => {
        const ad = firestoreTimestampToDate(a.updatedAt)?.getTime() ?? 0;
        const bd = firestoreTimestampToDate(b.updatedAt)?.getTime() ?? 0;
        return bd - ad;
      });
    case "name":
      return copy.sort((a, b) => a.trialName.localeCompare(b.trialName));
    case "sample":
      return copy.sort((a, b) => (b.sampleSize ?? 0) - (a.sampleSize ?? 0));
    case "sponsor":
      return copy.sort((a, b) =>
        (a.sponsor ?? "").localeCompare(b.sponsor ?? "")
      );
    case "newest":
    default:
      // Firestore already returned createdAt desc; keep that order.
      return copy;
  }
}

function HomeContent() {
  const { filters, setMany } = useTrialFilters();
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchTrials() {
      try {
        const res = await fetch("/api/trials");
        if (!res.ok) throw new Error("Failed to fetch trials");
        const data = await res.json();
        setTrials(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load trials");
      } finally {
        setLoading(false);
      }
    }
    fetchTrials();
  }, []);

  // `/` keyboard shortcut to focus search
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key !== "/") return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      searchRef.current?.focus();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Count trials per status (from full dataset)
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of trials) {
      if (t.status) {
        counts[t.status] = (counts[t.status] || 0) + 1;
      }
    }
    return counts;
  }, [trials]);

  const filtered = useMemo(() => {
    let result = trials;

    if (filters.q) {
      const q = filters.q.toLowerCase();
      result = result.filter(
        (t) =>
          t.trialName.toLowerCase().includes(q) ||
          t.nctId.toLowerCase().includes(q)
      );
    }
    if (filters.phase) {
      result = result.filter((t) => t.phase === filters.phase);
    }
    if (filters.status) {
      result = result.filter((t) => t.status === filters.status);
    }
    if (filters.sponsor) {
      result = result.filter((t) => t.sponsor === filters.sponsor);
    }
    if (filters.indication) {
      result = result.filter((t) => t.indication === filters.indication);
    }

    return sortTrials(result, filters.sort);
  }, [trials, filters]);

  function handleStatusClick(status: string) {
    setMany({ status: filters.status === status ? "" : status });
  }

  function handleExport() {
    const csv = trialsToCSV(filtered);
    const today = new Date().toISOString().slice(0, 10);
    downloadCSV(`trialvault-export-${today}.csv`, csv);
  }

  // Ordered list of statuses that exist in data
  const STATUS_ORDER = ["Recruiting", "Active", "Completed", "Terminated", "Unknown"];
  const activeStatuses = STATUS_ORDER.filter((s) => statusCounts[s]);

  const hasAnyFilter =
    filters.q ||
    filters.phase ||
    filters.status ||
    filters.sponsor ||
    filters.indication;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="flex-1">
          <SearchBar
            value={filters.q}
            onChange={(q) => setMany({ q })}
            inputRef={searchRef}
          />
        </div>
        <TrialFilters
          phase={filters.phase}
          sponsor={filters.sponsor}
          indication={filters.indication}
          onChange={setMany}
        />
      </div>

      {/* Status snapshot bar */}
      {!loading && !error && trials.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {activeStatuses.map((status) => {
            const isActive = filters.status === status;
            const style = STATUS_STYLES[status] ?? UNKNOWN_STATUS_STYLE;
            return (
              <button
                key={status}
                type="button"
                onClick={() => handleStatusClick(status)}
                className={`inline-flex items-center gap-1.5 rounded-[10px] border px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  isActive ? style.pillActive : style.pillInactive
                }`}
              >
                {status}:
                <span className="tabular-nums">{statusCounts[status]}</span>
              </button>
            );
          })}
          <span className="ml-auto flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              {filtered.length} trial{filtered.length !== 1 ? "s" : ""}
              {hasAnyFilter ? "" : " in database"}
            </span>
            <button
              type="button"
              onClick={handleExport}
              disabled={filtered.length === 0}
              title="Download filtered list as CSV"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[10px] border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
            >
              <Download className="size-3.5" />
              Export CSV
            </button>
          </span>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && <ErrorBanner message={error} className="mt-8" />}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="mt-16 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <FlaskConical className="size-8 text-primary" />
          </div>
          <p className="mt-4 text-lg font-semibold text-foreground">
            {trials.length === 0 ? "No trials yet" : "No matches found"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {trials.length === 0
              ? "Be the first to add a clinical trial record."
              : "Try adjusting your search or filters."}
          </p>
          {trials.length === 0 && (
            <Link
              href="/trials/new"
              className="mt-6 inline-flex min-h-[44px] items-center gap-1.5 rounded-[10px] bg-accent-orange px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-orange-hover active:scale-[0.98]"
            >
              <Plus className="size-4" />
              Add Your First Trial
            </Link>
          )}
        </div>
      )}

      {/* Trial Grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((trial) => (
            <TrialCard key={trial.id} trial={trial} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
