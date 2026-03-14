"use client";

import Link from "next/link";
import { Plus, FlaskConical } from "lucide-react";

export default function Nav() {
  return (
    <nav className="sticky top-0 z-40 border-b border-border/60 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 min-h-[44px]">
          <FlaskConical className="size-5 text-brand" />
          <span className="text-lg font-bold tracking-tight text-brand">
            TrialVault
          </span>
        </Link>
        <Link
          href="/trials/new"
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[10px] bg-accent-orange px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-orange-hover active:scale-[0.98]"
        >
          <Plus className="size-4" />
          Add Trial
        </Link>
      </div>
    </nav>
  );
}
