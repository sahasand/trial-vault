"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import TrialForm, { type TrialFormData } from "@/components/trials/trial-form";
import ErrorBanner from "@/components/ui/error-banner";
import { useTrialById } from "@/lib/hooks";
import { ArrowLeft } from "lucide-react";

export default function EditTrialPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { trial, loading, error: fetchError } = useTrialById(id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function handleSubmit(data: TrialFormData) {
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch(`/api/trials/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to update trial.");
      }

      router.push(`/trials/${id}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong."
      );
      setIsSubmitting(false);
    }
  }

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-8 sm:py-12">
        <div className="flex justify-center pt-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </main>
    );
  }

  /* ---------- Fetch Error ---------- */
  if (fetchError) {
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-8 sm:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors min-h-[44px]"
        >
          <ArrowLeft className="size-4" />
          Back to trials
        </Link>
        <ErrorBanner message={fetchError} className="mt-8" />
      </main>
    );
  }

  if (!trial) return null;

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8 sm:py-12">
      <Link
        href={`/trials/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors min-h-[44px]"
      >
        <ArrowLeft className="size-4" />
        Back to trial
      </Link>

      <h1 className="mt-4 mb-1 text-2xl font-bold tracking-tight">
        Edit Trial
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Update the details for{" "}
        <span className="font-medium text-foreground">{trial.trialName}</span>.
      </p>

      {submitError && <ErrorBanner message={submitError} className="mb-6" />}

      <TrialForm
        onSubmit={handleSubmit}
        defaultValues={{
          trialName: trial.trialName,
          nctId: trial.nctId,
          phase: trial.phase,
          sampleSize: trial.sampleSize,
          indication: trial.indication,
          sponsor: trial.sponsor,
          primaryEndpoint: trial.primaryEndpoint,
          status: trial.status,
          notes: trial.notes,
        }}
        isSubmitting={isSubmitting}
      />
    </main>
  );
}
