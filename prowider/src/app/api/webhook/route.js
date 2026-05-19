import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, idempotencyKey, payload } = body;

    if (!type || !idempotencyKey) {
      return NextResponse.json(
        { error: "type and idempotencyKey are required." },
        { status: 400 }
      );
    }

    try {
      await prisma.webhookEvent.create({
        data: {
          id: idempotencyKey,
          type,
          payload: payload ?? {},
        },
      });
    } catch (err) {
      if (err.code === "P2002") {
        return NextResponse.json({
          success: true,
          alreadyProcessed: true,
          message: `Webhook event '${idempotencyKey}' was already processed. No changes made.`,
        });
      }
      throw err;
    }

    if (type === "PAYMENT_SUCCESS") {
      await prisma.provider.updateMany({
        data: { leadsReceived: 0 },
      });

      await prisma.allocationState.updateMany({
        data: { poolIndex: 0 },
      });

      return NextResponse.json({
        success: true,
        alreadyProcessed: false,
        message: "Quota reset successfully for all providers.",
      });
    }

    return NextResponse.json(
      { error: `Unknown event type: ${type}` },
      { status: 400 }
    );
  } catch (error) {
    console.error("[POST /api/webhook]", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}