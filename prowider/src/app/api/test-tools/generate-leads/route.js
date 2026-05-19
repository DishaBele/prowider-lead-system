import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assignProvidersToLead } from "@/lib/allocation";
import { broadcastLeadUpdate } from "@/lib/sse";

const CITIES = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Pune", "Hyderabad"];
const NAMES = [
  "Rahul Sharma", "Priya Singh", "Amit Kumar", "Sneha Patel",
  "Raj Verma", "Anita Desai", "Kiran Rao", "Vikram Nair",
  "Deepa Iyer", "Suresh Reddy",
];

export async function POST() {
  try {
    const services = await prisma.service.findMany();

    const timestamp = Date.now();
    const leadsToCreate = Array.from({ length: 10 }, (_, i) => ({
      name: NAMES[i % NAMES.length],
      phone: `9${String(timestamp).slice(-9)}${i}`.slice(0, 10),
      city: CITIES[i % CITIES.length],
      serviceId: services[i % services.length].id,
      description: `Auto-generated test lead #${i + 1}`,
    }));

    const results = await Promise.allSettled(
      leadsToCreate.map(async (data) => {
        const service = services.find((s) => s.id === data.serviceId);
        const lead = await prisma.lead.create({ data });
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
        return { leadId: lead.id, assignedProviders };
      })
    );

    const succeeded = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);
    const failed = results
      .filter((r) => r.status === "rejected")
      .map((r) => r.reason?.message);

    return NextResponse.json({ succeeded, failed, total: results.length });
  } catch (error) {
    console.error("[POST /api/test-tools/generate-leads]", error);
    return NextResponse.json({ error: "Failed to generate leads." }, { status: 500 });
  }
}