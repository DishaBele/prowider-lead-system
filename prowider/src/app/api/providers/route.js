import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const providers = await prisma.provider.findMany({
      orderBy: { id: "asc" },
      include: {
        assignments: {
          orderBy: { assignedAt: "desc" },
          include: {
            lead: {
              include: { service: true },
            },
          },
        },
      },
    });

    const shaped = providers.map((p) => ({
      id: p.id,
      name: p.name,
      monthlyQuota: p.monthlyQuota,
      leadsReceived: p.leadsReceived,
      remainingQuota: p.monthlyQuota - p.leadsReceived,
      leads: p.assignments.map((a) => ({
        id: a.lead.id,
        customerName: a.lead.name,
        city: a.lead.city,
        service: a.lead.service.name,
        assignedAt: a.assignedAt,
      })),
    }));

    return NextResponse.json(shaped);
  } catch (error) {
    console.error("[GET /api/providers]", error);
    return NextResponse.json({ error: "Failed to fetch providers." }, { status: 500 });
  }
}