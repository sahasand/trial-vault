"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TrialForm, { type TrialFormData } from "@/components/trials/trial-form";
import ErrorBanner from "@/components/ui/error-banner";
import { ArrowLeft } from "lucide-react";

export default function NewTrialPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(data: TrialFormData) {
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/trials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to create trial.");
      }

      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8 sm:py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors min-h-[44px]"
      >
        <ArrowLeft className="size-4" />
        Back to trials
      </Link>

      <h1 className="mt-4 mb-1 text-2xl font-bold tracking-tight">
        Add New Trial
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Enter the details for a new clinical trial record.
      </p>

      {error && <ErrorBanner message={error} className="mb-6" />}

      <TrialForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </main>
  );
}
