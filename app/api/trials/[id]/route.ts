import { NextRequest, NextResponse } from "next/server";
import { getTrialById, updateTrial, deleteTrial } from "@/lib/firebase";
import { updateTrialSchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";
import { ZodError } from "zod";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const trial = await getTrialById(params.id);

    if (!trial) {
      return NextResponse.json({ error: "Trial not found." }, { status: 404 });
    }

    return NextResponse.json(trial);
  } catch (error) {
    logger.error("GET /api/trials/[id] error", error);
    return NextResponse.json(
      { error: "Failed to fetch trial." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await getTrialById(params.id);
    if (!existing) {
      return NextResponse.json({ error: "Trial not found." }, { status: 404 });
    }

    const body = await request.json();
    const updateData = updateTrialSchema.parse(body);

    await updateTrial(params.id, updateData);

    const updated = await getTrialById(params.id);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    logger.error("PUT /api/trials/[id] error", error);
    return NextResponse.json(
      { error: "Failed to update trial." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await getTrialById(params.id);
    if (!existing) {
      return NextResponse.json({ error: "Trial not found." }, { status: 404 });
    }

    await deleteTrial(params.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error("DELETE /api/trials/[id] error", error);
    return NextResponse.json(
      { error: "Failed to delete trial." },
      { status: 500 }
    );
  }
}
