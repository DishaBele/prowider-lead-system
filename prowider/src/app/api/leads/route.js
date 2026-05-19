import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assignProvidersToLead } from "@/lib/allocation";
import { broadcastLeadUpdate } from "@/lib/sse";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, phone, city, serviceId, description } = body;

    if (!name || !phone || !city || !serviceId || !description) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    const service = await prisma.service.findUnique({
      where: { id: Number(serviceId) },
    });
    if (!service) {
      return NextResponse.json({ error: "Invalid service." }, { status: 400 });
    }

    let lead;
    try {
      lead = await prisma.lead.create({
        data: {
          name,
          phone: phone.trim(),
          city,
          description,
          serviceId: Number(serviceId),
        },
      });
    } catch (err) {
      if (err.code === "P2002") {
        return NextResponse.json(
          { error: "A lead with this phone number already exists for this service. Duplicate leads are not allowed." },
          { status: 409 }
        );
      }
      throw err;
    }

    const assignedProviders = await assignProvidersToLead(lead.id, service.name);

    broadcastLeadUpdate({
      type: "NEW_LEAD",
      lead: {
        id: lead.id,
        name: lead.name,
        city: lead.city,
        service: service.name,
        assignedProviders,
        createdAt: lead.createdAt,
      },
    });

    return NextResponse.json(
      { success: true, leadId: lead.id, service: service.name, assignedProviders },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/leads]", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        service: true,
        assignments: {
          include: { provider: true },
        },
      },
    });
    return NextResponse.json(leads);
  } catch (error) {
    console.error("[GET /api/leads]", error);
    return NextResponse.json({ error: "Failed to fetch leads." }, { status: 500 });
  }
}