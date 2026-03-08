/**
 * Seed orchestrator – frameworks, verticals, demo, demo-enterprise.
 */
import { PrismaClient } from "@prisma/client";

import { seedDemo } from "./demo";
import { seedDemoEnterprise } from "./demo-enterprise";
import { seedFrameworks } from "./frameworks";

const prisma = new PrismaClient();

async function main() {
  const demoOrgId = await seedDemo(prisma);
  await seedFrameworks(prisma, demoOrgId);
  await seedDemoEnterprise(prisma);
}

main()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log("Seed complete.");
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
