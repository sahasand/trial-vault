import { NextRequest, NextResponse } from "next/server";
import { createTrial, getAllTrials } from "@/lib/firebase";
import { createTrialSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";
import { ZodError } from "zod";

export async function GET() {
  try {
    const trials = await getAllTrials();
    return NextResponse.json(trials);
  } catch (error) {
    logger.error("GET /api/trials error", error);
    return NextResponse.json(
      { error: "Failed to fetch trials." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const trialData = createTrialSchema.parse(body);
    const id = await createTrial(trialData);

    return NextResponse.json({ id, ...trialData }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    logger.error("POST /api/trials error", error);
    return NextResponse.json(
      { error: "Failed to create trial." },
      { status: 500 }
    );
  }
}
