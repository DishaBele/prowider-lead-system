import { prisma } from "./prisma";

const SERVICE_RULES = {
  "Service 1": {
    mandatory: ["Provider 1"],
    pool: ["Provider 2", "Provider 3", "Provider 4"],
    poolSlotsNeeded: 2,
  },
  "Service 2": {
    mandatory: ["Provider 5"],
    pool: ["Provider 6", "Provider 7", "Provider 8"],
    poolSlotsNeeded: 2,
  },
  "Service 3": {
    mandatory: ["Provider 1", "Provider 4"],
    pool: ["Provider 2", "Provider 3", "Provider 5", "Provider 6", "Provider 7", "Provider 8"],
    poolSlotsNeeded: 1,
  },
};

const TOTAL_ASSIGNMENTS = 3;

export async function assignProvidersToLead(leadId, serviceName) {
  const rules = SERVICE_RULES[serviceName];
  if (!rules) throw new Error(`Unknown service: ${serviceName}`);

  return await prisma.$transaction(
    async (tx) => {
      const service = await tx.service.findUnique({ where: { name: serviceName } });

      const allocState = await tx.$queryRaw`
        SELECT * FROM "AllocationState"
        WHERE "serviceId" = ${service.id}
        FOR UPDATE
      `;
      const state = allocState[0];

      const mandatory = await Promise.all(
        rules.mandatory.map((name) =>
          tx.provider.findUnique({ where: { name } })
        )
      );

      const assigned = [];

      for (const provider of mandatory) {
        if (!provider) continue;
        const remaining = provider.monthlyQuota - provider.leadsReceived;
        if (remaining > 0) {
          assigned.push(provider);
        }
      }

      const slotsNeeded = TOTAL_ASSIGNMENTS - assigned.length;
      const assignedIds = new Set(assigned.map((p) => p.id));

      const poolProviders = await tx.provider.findMany({
        where: { name: { in: rules.pool } },
        orderBy: { id: "asc" },
      });

      const eligible = poolProviders.filter(
        (p) => !assignedIds.has(p.id) && p.monthlyQuota - p.leadsReceived > 0
      );

      let pickedCount = 0;
      let idx = state.poolIndex % Math.max(eligible.length, 1);
      const startIdx = idx;
      const picked = [];

      if (eligible.length > 0) {
        while (pickedCount < slotsNeeded) {
          const candidate = eligible[idx % eligible.length];
          if (!assignedIds.has(candidate.id)) {
            picked.push(candidate);
            assignedIds.add(candidate.id);
            pickedCount++;
          }
          idx++;
          if (idx - startIdx >= eligible.length && pickedCount < slotsNeeded) break;
        }
      }

      const nextIndex = (state.poolIndex + picked.length) % Math.max(eligible.length, 1);
      await tx.$executeRaw`
        UPDATE "AllocationState"
        SET "poolIndex" = ${nextIndex}
        WHERE "serviceId" = ${service.id}
      `;

      const finalAssigned = [...assigned, ...picked];

      for (const provider of finalAssigned) {
        await tx.leadAssignment.create({
          data: { leadId, providerId: provider.id },
        });
        await tx.provider.update({
          where: { id: provider.id },
          data: { leadsReceived: { increment: 1 } },
        });
      }

      return finalAssigned.map((p) => p.name);
    },
    {
      isolationLevel: "Serializable",
      timeout: 10000,
    }
  );
}