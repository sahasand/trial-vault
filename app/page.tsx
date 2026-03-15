"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import type { Trial } from "@/lib/types";
import TrialCard from "@/components/trials/trial-card";
import TrialFilters from "@/components/trials/trial-filters";
import SearchBar from "@/components/ui/search-bar";
import ErrorBanner from "@/components/ui/error-banner";
import { Plus, FlaskConical } from "lucide-react";

const STATUS_PILL_STYLES: Record<string, { active: string; inactive: string }> = {
  Recruiting: {
    active: "bg-emerald-600 text-white border-emerald-600",
    inactive: "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50",
  },
  Active: {
    active: "bg-blue-600 text-white border-blue-600",
    inactive: "bg-white text-blue-700 border-blue-300 hover:bg-blue-50",
  },
  Completed: {
    active: "bg-gray-500 text-white border-gray-500",
    inactive: "bg-white text-gray-600 border-gray-300 hover:bg-gray-50",
  },
  Terminated: {
    active: "bg-red-600 text-white border-red-600",
    inactive: "bg-white text-red-700 border-red-300 hover:bg-red-50",
  },
  Unknown: {
    active: "bg-amber-500 text-white border-amber-500",
    inactive: "bg-white text-amber-700 border-amber-300 hover:bg-amber-50",
  },
};

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

export default function Home() {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [phase, setPhase] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.trialName.toLowerCase().includes(q) ||
          t.nctId.toLowerCase().includes(q)
      );
    }

    if (phase) {
      result = result.filter((t) => t.phase === phase);
    }

    if (statusFilter) {
      result = result.filter((t) => t.status === statusFilter);
    }

    return result;
  }, [trials, search, phase, statusFilter]);

  function handlePhaseChange(val: string) {
    setPhase(val === "all" ? "" : val);
  }

  function handleStatusClick(status: string) {
    setStatusFilter((prev) => (prev === status ? "" : status));
  }

  // Ordered list of statuses that exist in data
  const STATUS_ORDER = ["Recruiting", "Active", "Completed", "Terminated", "Unknown"];
  const activeStatuses = STATUS_ORDER.filter((s) => statusCounts[s]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} />
        </div>
        <TrialFilters phase={phase} onPhaseChange={handlePhaseChange} />
      </div>

      {/* Status snapshot bar */}
      {!loading && !error && trials.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {activeStatuses.map((status) => {
            const isActive = statusFilter === status;
            const styles = STATUS_PILL_STYLES[status] ?? STATUS_PILL_STYLES["Unknown"];
            return (
              <button
                key={status}
                type="button"
                onClick={() => handleStatusClick(status)}
                className={`inline-flex items-center gap-1.5 rounded-[10px] border px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  isActive ? styles.active : styles.inactive
                }`}
              >
                {status}:
                <span className="tabular-nums">{statusCounts[status]}</span>
              </button>
            );
          })}
          <span className="ml-auto text-sm text-muted-foreground">
            {filtered.length} trial{filtered.length !== 1 ? "s" : ""}
            {statusFilter || phase || search ? "" : " in database"}
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
