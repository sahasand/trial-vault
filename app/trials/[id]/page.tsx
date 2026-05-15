"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useTrialById } from "@/lib/hooks";
import { STATUS_COLORS, PHASE_COLORS } from "@/lib/constants";
import { firestoreTimestampToDate, timeAgo } from "@/lib/utils";
import ErrorBanner from "@/components/ui/error-banner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Pencil, Trash2, RefreshCw } from "lucide-react";

function FieldRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | number | undefined;
  mono?: boolean;
}) {
  const display =
    value === undefined || value === "" || value === 0 ? "---" : String(value);

  return (
    <div className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0">
      <dt className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd
        className={`text-[15px] leading-relaxed ${
          mono ? "font-mono tracking-wider" : ""
        } ${display === "---" ? "text-muted-foreground/50" : "text-foreground"}`}
      >
        {display}
      </dd>
    </div>
  );
}

export default function TrialDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { trial, setTrial, loading, error: fetchError } = useTrialById(id);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/trials/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        throw new Error("Failed to delete trial");
      }
      router.push("/");
    } catch {
      setDeleteError("Failed to delete trial. Please try again.");
      setDeleting(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshError("");
    setRefreshSuccess(false);
    try {
      const res = await fetch(`/api/trials/${id}/refresh`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error ?? "Failed to refresh trial.");
      }
      setTrial(body);
      setRefreshSuccess(true);
      setTimeout(() => setRefreshSuccess(false), 3000);
    } catch (err) {
      setRefreshError(
        err instanceof Error ? err.message : "Failed to refresh trial."
      );
    } finally {
      setRefreshing(false);
    }
  }

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex justify-center pt-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  /* ---------- Error ---------- */
  if (fetchError && !trial) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors min-h-[44px]"
        >
          <ArrowLeft className="size-4" />
          Back to trials
        </Link>
        <ErrorBanner message={fetchError} className="mt-8" />
      </div>
    );
  }

  if (!trial) return null;

  const statusColor =
    STATUS_COLORS[trial.status] ?? STATUS_COLORS["Unknown"];
  const phaseColor =
    PHASE_COLORS[trial.phase] ?? PHASE_COLORS["N/A"];

  const syncDate = firestoreTimestampToDate(trial.lastSyncedAt);
  const syncAgeDays = syncDate
    ? (Date.now() - syncDate.getTime()) / 86_400_000
    : null;
  const syncBadgeClass =
    syncAgeDays === null
      ? "text-muted-foreground"
      : syncAgeDays > 90
        ? "text-red-600"
        : syncAgeDays > 30
          ? "text-amber-600"
          : "text-muted-foreground";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors min-h-[44px]"
      >
        <ArrowLeft className="size-4" />
        Back to trials
      </Link>

      {/* Header */}
      <div className="mt-6">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          {trial.phase && (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${phaseColor}`}
            >
              Phase {trial.phase}
            </span>
          )}
          {trial.status && (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusColor}`}
            >
              {trial.status}
            </span>
          )}
        </div>

        {/* Title — brief (first 100 chars) */}
        <h1 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl line-clamp-2">
          {trial.trialName.length > 100
            ? `${trial.trialName.slice(0, 100)}…`
            : trial.trialName}
        </h1>

        {/* NCT ID */}
        {trial.nctId && (
          <p className="mt-1.5 font-mono text-sm tracking-wider text-muted-foreground">
            {trial.nctId}
          </p>
        )}

        {/* Last synced badge */}
        {syncDate && (
          <p className={`mt-1 text-xs ${syncBadgeClass}`}>
            Synced from ClinicalTrials.gov {timeAgo(syncDate)}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/trials/${id}/edit`}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[10px] border border-primary/30 bg-primary/5 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          <Pencil className="size-4" />
          Edit
        </Link>

        {trial.nctId && (
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[10px] border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
          >
            <RefreshCw
              className={`size-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        )}

        <AlertDialog onOpenChange={(open) => { if (open) setConfirmText(""); }}>
          <AlertDialogTrigger
            render={
              <button
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[10px] bg-destructive/10 px-4 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
                disabled={deleting}
              />
            }
          >
            <Trash2 className="size-4" />
            {deleting ? "Deleting..." : "Delete"}
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this trial?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The trial record will be
                permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2 py-2">
              <p className="text-sm text-muted-foreground">
                Type{" "}
                <span className="font-mono font-semibold text-foreground">
                  {trial.trialName}
                </span>{" "}
                to confirm:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={trial.trialName}
                className="flex w-full min-h-[44px] rounded-[10px] border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:border-destructive focus-visible:ring-3 focus-visible:ring-destructive/20"
                autoComplete="off"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={handleDelete}
                disabled={confirmText !== trial.trialName}
                className="min-h-[44px] disabled:pointer-events-none disabled:opacity-40"
              >
                Delete Trial
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Error banner (for delete failures) */}
      {deleteError && <ErrorBanner message={deleteError} className="mt-4" />}

      {/* Refresh feedback */}
      {refreshError && <ErrorBanner message={refreshError} className="mt-4" />}
      {refreshSuccess && (
        <div className="mt-4 rounded-[8px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Refreshed from ClinicalTrials.gov.
        </div>
      )}

      {/* Sections */}
      <div className="mt-8 space-y-8">
        {/* Core Info */}
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-primary/60 border-b border-primary/15 pb-2">
            Core Info
          </h2>
          <dl className="divide-y divide-border/40">
            <FieldRow label="Display Name" value={trial.trialName} />
            {trial.officialTitle && (
              <div className="flex flex-col gap-0.5 py-3">
                <dt className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Full Title
                </dt>
                <dd className="text-[13px] leading-relaxed text-muted-foreground">
                  {trial.officialTitle}
                </dd>
              </div>
            )}
            <FieldRow label="NCT ID" value={trial.nctId} mono />
            <FieldRow
              label="Phase"
              value={trial.phase ? `Phase ${trial.phase}` : undefined}
            />
            <FieldRow label="Status" value={trial.status} />
          </dl>
        </section>

        {/* Trial Details */}
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-primary/60 border-b border-primary/15 pb-2">
            Trial Details
          </h2>
          <dl className="divide-y divide-border/40">
            <FieldRow
              label="Sample Size"
              value={trial.sampleSize ? trial.sampleSize.toLocaleString() : undefined}
            />
            <FieldRow label="Indication" value={trial.indication} />
            <FieldRow label="Sponsor" value={trial.sponsor} />
          </dl>
        </section>

        {/* Endpoints & Notes */}
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-primary/60 border-b border-primary/15 pb-2">
            Endpoints &amp; Notes
          </h2>
          <dl className="divide-y divide-border/40">
            <FieldRow
              label="Primary Endpoint"
              value={trial.primaryEndpoint}
            />
            <FieldRow label="Notes" value={trial.notes} />
          </dl>
        </section>
      </div>
    </div>
  );
}
