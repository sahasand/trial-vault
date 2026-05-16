"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PHASES } from "@/lib/constants";
import type { TrialFilterState } from "@/lib/hooks";
import { X } from "lucide-react";

interface TrialFiltersProps {
  phase: string;
  sponsor: string;
  indication: string;
  onChange: (patch: Partial<TrialFilterState>) => void;
}

const trigger =
  "w-full min-h-[44px] rounded-[10px] focus:border-primary focus:ring-3 focus:ring-primary/20";

export default function TrialFilters({
  phase,
  sponsor,
  indication,
  onChange,
}: TrialFiltersProps) {
  const hasFacet = phase !== "" || sponsor !== "" || indication !== "";

  function fromAll(v: string | null): string {
    return !v || v === "all" ? "" : v;
  }

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <Select
        value={phase || "all"}
        onValueChange={(v) => onChange({ phase: fromAll(v) })}
      >
        <SelectTrigger className={`${trigger} sm:w-[140px]`}>
          <SelectValue>
            {(v: string) => (v === "all" ? "All Phases" : `Phase ${v}`)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Phases</SelectItem>
          {PHASES.map((p) => (
            <SelectItem key={p} value={p}>
              Phase {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFacet && (
        <button
          type="button"
          onClick={() =>
            onChange({ phase: "", sponsor: "", indication: "" })
          }
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1 rounded-[10px] px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="size-4" />
          Clear
        </button>
      )}
    </div>
  );
}
