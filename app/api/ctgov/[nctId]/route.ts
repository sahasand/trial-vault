import { NextRequest, NextResponse } from "next/server";
import { NCT_ID_PATTERN, mapCtgovToTrial } from "@/lib/ctgov";
import { logger } from "@/lib/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: { nctId: string } }
) {
  const { nctId } = params;

  if (!NCT_ID_PATTERN.test(nctId)) {
    return NextResponse.json(
      { success: false, error: "Invalid NCT ID format. Expected NCTxxxxxxxx." },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `https://clinicaltrials.gov/api/v2/studies/${nctId.toUpperCase()}`,
      { headers: { Accept: "application/json" } }
    );

    if (res.status === 404) {
      return NextResponse.json(
        { success: false, error: "No trial found for this NCT ID." },
        { status: 404 }
      );
    }

    if (!res.ok) {
      logger.error("ClinicalTrials.gov API error", {
        status: res.status,
        nctId,
      });
      return NextResponse.json(
        { success: false, error: "Could not reach ClinicalTrials.gov. Try again." },
        { status: 502 }
      );
    }

    const apiData = await res.json();
    const data = mapCtgovToTrial(apiData);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error("ClinicalTrials.gov fetch failed", error);
    return NextResponse.json(
      { success: false, error: "Could not reach ClinicalTrials.gov. Try again." },
      { status: 502 }
    );
  }
}
