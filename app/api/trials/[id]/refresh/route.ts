import { NextRequest, NextResponse } from "next/server";
import { getTrialById, syncTrial } from "@/lib/firebase";
import { mapCtgovToTrial } from "@/lib/ctgov";
import { logger } from "@/lib/logger";

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

    // Overwrite CT.gov-sourced fields; preserve trialName (user's display name)
    // and notes (user-only).
    await syncTrial(params.id, {
      officialTitle: ctgov.trialName,
      phase: ctgov.phase,
      sampleSize: ctgov.sampleSize,
      indication: ctgov.indication,
      sponsor: ctgov.sponsor,
      primaryEndpoint: ctgov.primaryEndpoint,
      status: ctgov.status,
    });

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
