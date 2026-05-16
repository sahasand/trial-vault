import { NextRequest, NextResponse } from "next/server";
import { getTrialById, syncTrial } from "@/lib/firebase";
import { mapCtgovToTrial } from "@/lib/ctgov";
import { logger } from "@/lib/logger";
import type { UpdateTrialData } from "@/lib/types";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await getTrialById(params.id);
    if (!existing) {
      return NextResponse.json({ error: "Trial not found." }, { status: 404 });
    }

    if (!existing.nctId) {
      return NextResponse.json(
        {
          error:
            "Trial has no NCT ID — add one before refreshing from ClinicalTrials.gov.",
        },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://clinicaltrials.gov/api/v2/studies/${existing.nctId}`,
      { headers: { Accept: "application/json" } }
    );

    if (res.status === 404) {
      return NextResponse.json(
        { error: "Trial no longer exists on ClinicalTrials.gov." },
        { status: 404 }
      );
    }

    if (!res.ok) {
      logger.error("ClinicalTrials.gov refresh API error", {
        status: res.status,
        nctId: existing.nctId,
      });
      return NextResponse.json(
        { error: "Could not reach ClinicalTrials.gov. Try again." },
        { status: 502 }
      );
    }

    const ctgov = mapCtgovToTrial(await res.json());

    // Overwrite CT.gov-sourced fields with whatever the API returned —
    // but skip empties so a missing field doesn't wipe existing data.
    // trialName (user's display name) and notes (user-only) are never touched.
    const updates: UpdateTrialData = {};
    if (ctgov.trialName) updates.officialTitle = ctgov.trialName;
    if (ctgov.phase) updates.phase = ctgov.phase;
    if (ctgov.sampleSize > 0) updates.sampleSize = ctgov.sampleSize;
    if (ctgov.indication) updates.indication = ctgov.indication;
    if (ctgov.sponsor) updates.sponsor = ctgov.sponsor;
    if (ctgov.primaryEndpoint) updates.primaryEndpoint = ctgov.primaryEndpoint;
    if (ctgov.status) updates.status = ctgov.status;

    await syncTrial(params.id, updates);

    const updated = await getTrialById(params.id);
    return NextResponse.json(updated);
  } catch (error) {
    logger.error("POST /api/trials/[id]/refresh error", error);
    return NextResponse.json(
      { error: "Failed to refresh trial." },
      { status: 500 }
    );
  }
}
