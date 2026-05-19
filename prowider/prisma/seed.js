const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const services = await Promise.all(
    ["Service 1", "Service 2", "Service 3"].map((name) =>
      prisma.service.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );
  console.log("Services done:", services.map((s) => s.name));

  const providers = await Promise.all(
    Array.from({ length: 8 }, (_, i) => i + 1).map((num) =>
      prisma.provider.upsert({
        where: { name: `Provider ${num}` },
        update: {},
        create: {
          name: `Provider ${num}`,
          monthlyQuota: 10,
          leadsReceived: 0,
        },
      })
    )
  );
  console.log("Providers done:", providers.map((p) => p.name));

  for (const service of services) {
    await prisma.allocationState.upsert({
      where: { serviceId: service.id },
      update: {},
      create: { serviceId: service.id, poolIndex: 0 },
    });
  }
  console.log("AllocationState done");
  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });