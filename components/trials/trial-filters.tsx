"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PHASES } from "@/lib/constants";
import { X } from "lucide-react";

interface TrialFiltersProps {
  phase: string;
  onPhaseChange: (phase: string) => void;
}

export default function TrialFilters({
  phase,
  onPhaseChange,
}: TrialFiltersProps) {
  const isActive = phase !== "";

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <Select value={phase} onValueChange={(val) => onPhaseChange(val ?? "")}>
        <SelectTrigger className="w-full sm:w-[160px] min-h-[44px] rounded-[10px] focus:border-primary focus:ring-3 focus:ring-primary/20">
          <SelectValue placeholder="All Phases" />
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

      {isActive && (
        <button
          type="button"
          onClick={() => onPhaseChange("")}
          className="inline-flex min-h-[44px] shrink-0 items-center gap-1 rounded-[10px] px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="size-4" />
          Clear
        </button>
      )}
    </div>
  );
}
