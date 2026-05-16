"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Trial } from "./types";

export function useTrialById(id: string) {
  const [trial, setTrial] = useState<Trial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTrial() {
      try {
        const res = await fetch(`/api/trials/${id}`);
        if (res.status === 404) {
          setError("Trial not found.");
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch trial");
        setTrial(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load trial");
      } finally {
        setLoading(false);
      }
    }
    fetchTrial();
  }, [id]);

  return { trial, setTrial, loading, error };
}

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "updated", label: "Recently updated" },
  { value: "name", label: "Name A→Z" },
  { value: "sample", label: "Sample size (high→low)" },
  { value: "sponsor", label: "Sponsor A→Z" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

const DEFAULT_SORT: SortValue = "newest";

function isSortValue(v: string | null): v is SortValue {
  return !!v && SORT_OPTIONS.some((o) => o.value === v);
}

export interface TrialFilterState {
  q: string;
  phase: string;
  status: string;
  sponsor: string;
  indication: string;
  sort: SortValue;
}

export function useTrialFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const filters: TrialFilterState = useMemo(
    () => ({
      q: params.get("q") ?? "",
      phase: params.get("phase") ?? "",
      status: params.get("status") ?? "",
      sponsor: params.get("sponsor") ?? "",
      indication: params.get("indication") ?? "",
      sort: isSortValue(params.get("sort"))
        ? (params.get("sort") as SortValue)
        : DEFAULT_SORT,
    }),
    [params]
  );

  const setMany = useCallback(
    (patch: Partial<TrialFilterState>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === "" || v === DEFAULT_SORT) {
          next.delete(k);
        } else {
          next.set(k, String(v));
        }
      }
      const qs = next.toString();
      router.replace(qs ? `/?${qs}` : "/", { scroll: false });
    },
    [params, router]
  );

  const clearAll = useCallback(() => {
    router.replace("/", { scroll: false });
  }, [router]);

  return { filters, setMany, clearAll };
}

export function trialFilterHref(patch: Partial<TrialFilterState>): string {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries(patch)) {
    if (v !== "" && v !== DEFAULT_SORT && v != null) {
      next.set(k, String(v));
    }
  }
  const qs = next.toString();
  return qs ? `/?${qs}` : "/";
}
