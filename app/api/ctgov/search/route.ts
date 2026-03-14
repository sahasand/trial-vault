import { NextRequest, NextResponse } from "next/server";
import { mapCtgovToSearchResult } from "@/lib/ctgov";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json(
      { success: false, error: "Search query is required." },
      { status: 400 }
    );
  }

  try {
    const url = new URL("https://clinicaltrials.gov/api/v2/studies");
    url.searchParams.set("query.term", q);
    url.searchParams.set("pageSize", "5");

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      logger.error("ClinicalTrials.gov search API error", {
        status: res.status,
        query: q,
      });
      return NextResponse.json(
        { success: false, error: "Could not reach ClinicalTrials.gov. Try again." },
        { status: 502 }
      );
    }

    const data = await res.json();
    const studies = data.studies ?? [];
    const results = studies.map(mapCtgovToSearchResult);

    return NextResponse.json({ success: true, results });
  } catch (error) {
    logger.error("ClinicalTrials.gov search failed", error);
    return NextResponse.json(
      { success: false, error: "Could not reach ClinicalTrials.gov. Try again." },
      { status: 502 }
    );
  }
}
