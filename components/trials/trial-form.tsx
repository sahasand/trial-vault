"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import type { Trial } from "@/lib/types";
import { PHASES, STATUSES } from "@/lib/constants";
import {
  NCT_ID_PATTERN,
  type CtgovTrialData,
  type CtgovSearchResult,
} from "@/lib/ctgov";
import ErrorBanner from "@/components/ui/error-banner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";

export type TrialFormData = Omit<Trial, "id" | "createdAt" | "updatedAt">;

interface TrialFormProps {
  onSubmit: (data: TrialFormData) => Promise<void>;
  defaultValues?: Partial<TrialFormData>;
  isSubmitting?: boolean;
}

const INITIAL_FORM: TrialFormData = {
  trialName: "",
  nctId: "",
  phase: "",
  sampleSize: 0,
  indication: "",
  sponsor: "",
  primaryEndpoint: "",
  status: "",
  notes: "",
  officialTitle: "",
};

type LookupResult =
  | { type: "success"; count: number }
  | { type: "error"; message: string }
  | null;

export default function TrialForm({
  onSubmit,
  defaultValues,
  isSubmitting = false,
}: TrialFormProps) {
  const [form, setForm] = useState<TrialFormData>({
    ...INITIAL_FORM,
    ...defaultValues,
  });
  const [sampleSizeStr, setSampleSizeStr] = useState(
    defaultValues?.sampleSize?.toString() ?? ""
  );
  const [error, setError] = useState("");

  // Import state
  const [importQuery, setImportQuery] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<LookupResult>(null);
  const [searchResults, setSearchResults] = useState<CtgovSearchResult[] | null>(
    null
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setSearchResults(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function updateField<K extends keyof TrialFormData>(
    key: K,
    value: TrialFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function applyLookupData(data: CtgovTrialData, nctId: string): number {
    let count = 0;
    const updates: Partial<TrialFormData> = {};

    // Always set officialTitle from API
    if (data.trialName) {
      updates.officialTitle = data.trialName;
    }
    if (!form.trialName && data.trialName) {
      updates.trialName = data.trialName;
      count++;
    }
    if (!form.phase && data.phase) {
      updates.phase = data.phase;
      count++;
    }
    if ((!form.sampleSize || form.sampleSize === 0) && data.sampleSize) {
      updates.sampleSize = data.sampleSize;
      setSampleSizeStr(data.sampleSize.toString());
      count++;
    }
    if (!form.indication && data.indication) {
      updates.indication = data.indication;
      count++;
    }
    if (!form.sponsor && data.sponsor) {
      updates.sponsor = data.sponsor;
      count++;
    }
    if (!form.primaryEndpoint && data.primaryEndpoint) {
      updates.primaryEndpoint = data.primaryEndpoint;
      count++;
    }
    if (!form.status && data.status) {
      updates.status = data.status;
      count++;
    }

    // Always set NCT ID
    updates.nctId = nctId;

    setForm((prev) => ({ ...prev, ...updates }));
    return count;
  }

  async function fetchByNctId(nctId: string) {
    setImportLoading(true);
    setLookupResult(null);
    setSearchResults(null);

    try {
      const res = await fetch(`/api/ctgov/${nctId}`);
      const body = await res.json();

      if (!body.success) {
        setLookupResult({ type: "error", message: body.error });
        return;
      }

      const count = applyLookupData(body.data, nctId);
      setLookupResult({ type: "success", count });
    } catch {
      setLookupResult({
        type: "error",
        message: "Could not reach ClinicalTrials.gov. Try again.",
      });
    } finally {
      setImportLoading(false);
    }
  }

  async function fetchByKeyword(query: string) {
    setImportLoading(true);
    setLookupResult(null);
    setSearchResults(null);

    try {
      const res = await fetch(
        `/api/ctgov/search?q=${encodeURIComponent(query)}`
      );
      const body = await res.json();

      if (!body.success) {
        setLookupResult({ type: "error", message: body.error });
        return;
      }

      if (body.results.length === 0) {
        setLookupResult({
          type: "error",
          message: "No trials found. Try different keywords.",
        });
        return;
      }

      setSearchResults(body.results);
    } catch {
      setLookupResult({
        type: "error",
        message: "Could not reach ClinicalTrials.gov. Try again.",
      });
    } finally {
      setImportLoading(false);
    }
  }

  function handleImport() {
    const query = importQuery.trim();
    if (!query) return;

    if (NCT_ID_PATTERN.test(query)) {
      fetchByNctId(query.toUpperCase());
    } else {
      fetchByKeyword(query);
    }
  }

  async function handleSelectResult(nctId: string) {
    setSearchResults(null);
    setImportQuery(nctId);
    await fetchByNctId(nctId);
  }

  function handleImportBlur() {
    const query = importQuery.trim();
    if (query && NCT_ID_PATTERN.test(query)) {
      fetchByNctId(query.toUpperCase());
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.trialName.trim()) {
      setError("Trial name is required.");
      return;
    }

    try {
      await onSubmit({
        ...form,
        trialName: form.trialName.trim(),
        nctId: form.nctId.trim().toUpperCase(),
        sampleSize: sampleSizeStr ? parseInt(sampleSizeStr, 10) : 0,
        indication: form.indication.trim(),
        sponsor: form.sponsor.trim(),
        primaryEndpoint: form.primaryEndpoint.trim(),
        notes: form.notes.trim(),
        officialTitle: form.officialTitle?.trim() ?? "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save trial.");
    }
  }

  function handleNctIdBlur() {
    updateField("nctId", form.nctId.trim().toUpperCase());
  }

  const lbl =
    "text-[11px] font-semibold uppercase tracking-widest text-muted-foreground";
  const field =
    "min-h-[44px] rounded-[10px] focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20";

  const STATUS_DOT: Record<string, string> = {
    Recruiting: "text-emerald-600",
    Active: "text-blue-600",
    Completed: "text-gray-500",
    Terminated: "text-red-600",
    Unknown: "text-amber-600",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <ErrorBanner message={error} />}

      {/* Quick Import Section */}
      <div className="rounded-[10px] border border-primary/20 bg-primary/[0.03] p-4 space-y-3">
        <div>
          <p className="text-sm font-bold text-foreground">
            Quick Import from ClinicalTrials.gov
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Search by trial name, condition, drug, sponsor — or paste an NCT ID
          </p>
        </div>
        <div className="relative" ref={dropdownRef}>
          <div className="flex gap-2">
            <Input
              value={importQuery}
              onChange={(e) => {
                setImportQuery(e.target.value);
                setLookupResult(null);
                setSearchResults(null);
              }}
              onBlur={handleImportBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleImport();
                }
                if (e.key === "Escape") {
                  setSearchResults(null);
                }
              }}
              placeholder="e.g. NCT04280705 or pembrolizumab breast cancer"
              disabled={importLoading}
              className={`${field} flex-1`}
            />
            <button
              type="button"
              onClick={handleImport}
              disabled={importLoading || !importQuery.trim()}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[10px] bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {importLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              {importLoading ? "Searching..." : "Search"}
            </button>
          </div>

          {/* Search Results Dropdown */}
          {searchResults && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-[10px] border border-border bg-card shadow-lg overflow-hidden">
              {searchResults.map((result) => (
                <button
                  key={result.nctId}
                  type="button"
                  onClick={() => handleSelectResult(result.nctId)}
                  className="flex w-full flex-col gap-0.5 border-b border-border/40 px-3 py-2.5 text-left transition-colors hover:bg-primary/5 last:border-b-0"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {result.trialName}
                    </span>
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {result.nctId}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {result.phase && <span>Phase {result.phase}</span>}
                    {result.phase && result.sponsor && <span>·</span>}
                    {result.sponsor && (
                      <span className="truncate">{result.sponsor}</span>
                    )}
                    {result.status && (
                      <>
                        <span>·</span>
                        <span
                          className={
                            STATUS_DOT[result.status] ?? "text-muted-foreground"
                          }
                        >
                          {result.status}
                        </span>
                      </>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {lookupResult?.type === "success" && (
          <div className="rounded-[8px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Found — {lookupResult.count} field
            {lookupResult.count !== 1 ? "s" : ""} auto-filled
          </div>
        )}
        {lookupResult?.type === "error" && (
          <ErrorBanner message={lookupResult.message} />
        )}
      </div>

      <hr className="border-border/50" />

      <div className="space-y-1.5">
        <Label htmlFor="trialName" className={lbl}>
          Display Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="trialName"
          value={form.trialName}
          onChange={(e) => updateField("trialName", e.target.value)}
          placeholder="e.g. KEYNOTE-522 or a short acronym"
          required
          className={field}
        />
        {form.officialTitle && (
          <p className="text-[11px] text-muted-foreground/70 mt-1">
            Edit this to a short name or acronym. The full title is preserved below.
          </p>
        )}
      </div>

      {form.officialTitle && (
        <div className="space-y-1.5">
          <Label className={lbl}>
            Full Title (from ClinicalTrials.gov)
          </Label>
          <div className="rounded-[10px] bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground leading-relaxed">
            {form.officialTitle}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="nctId" className={lbl}>
          NCT ID
        </Label>
        <Input
          id="nctId"
          value={form.nctId}
          onChange={(e) => updateField("nctId", e.target.value)}
          onBlur={handleNctIdBlur}
          placeholder="e.g. NCT04280705"
          className={`${field} font-mono tracking-wider`}
        />
      </div>

      <hr className="border-border/50" />

      <div className="space-y-1.5">
        <Label className={lbl}>Phase</Label>
        <Select
          value={form.phase}
          onValueChange={(val) => updateField("phase", val as string)}
        >
          <SelectTrigger className={`w-full ${field}`}>
            <SelectValue placeholder="Select phase..." />
          </SelectTrigger>
          <SelectContent>
            {PHASES.map((p) => (
              <SelectItem key={p} value={p}>
                {p === "N/A" ? "N/A" : `Phase ${p}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sampleSize" className={lbl}>
          Sample Size
        </Label>
        <Input
          id="sampleSize"
          type="number"
          value={sampleSizeStr}
          onChange={(e) => setSampleSizeStr(e.target.value)}
          placeholder="e.g. 1200"
          min={0}
          className={field}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="indication" className={lbl}>
          Indication
        </Label>
        <Input
          id="indication"
          value={form.indication}
          onChange={(e) => updateField("indication", e.target.value)}
          placeholder="e.g. Triple-negative breast cancer"
          className={field}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sponsor" className={lbl}>
          Sponsor
        </Label>
        <Input
          id="sponsor"
          value={form.sponsor}
          onChange={(e) => updateField("sponsor", e.target.value)}
          placeholder="e.g. Merck Sharp & Dohme"
          className={field}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="primaryEndpoint" className={lbl}>
          Primary Endpoint
        </Label>
        <Input
          id="primaryEndpoint"
          value={form.primaryEndpoint}
          onChange={(e) => updateField("primaryEndpoint", e.target.value)}
          placeholder="e.g. Pathological complete response (pCR)"
          className={field}
        />
      </div>

      <hr className="border-border/50" />

      <div className="space-y-1.5">
        <Label className={lbl}>Status</Label>
        <Select
          value={form.status}
          onValueChange={(val) => updateField("status", val as string)}
        >
          <SelectTrigger className={`w-full ${field}`}>
            <SelectValue placeholder="Select status..." />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes" className={lbl}>
          Notes
        </Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          placeholder="Additional notes about this trial..."
          rows={3}
          className="min-h-[88px] rounded-[10px] focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full min-h-[48px] items-center justify-center rounded-[10px] bg-accent-orange text-base font-semibold text-white transition-colors hover:bg-accent-orange-hover focus-visible:ring-3 focus-visible:ring-accent-orange/30 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : "Save Trial"}
      </button>
    </form>
  );
}
