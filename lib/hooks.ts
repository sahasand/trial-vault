"use client";

import { useEffect, useState } from "react";
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

  return { trial, loading, error };
}
