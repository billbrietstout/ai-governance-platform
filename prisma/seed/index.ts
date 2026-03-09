/**
 * Seed orchestrator – frameworks, verticals, demo, demo-enterprise.
 */
import { PrismaClient } from "@prisma/client";

import { seedDemo } from "./demo";
import { seedDemoEnterprise } from "./demo-enterprise";
import { seedDemoEnterpriseP2 } from "./demo-enterprise-p2";
import { seedDemoEnterpriseP3 } from "./demo-enterprise-p3";
import { seedDemoEnterpriseP4 } from "./demo-enterprise-p4";
import { seedFrameworks } from "./frameworks";

const prisma = new PrismaClient();

async function main() {
  const demoOrgId = await seedDemo(prisma);
  await seedFrameworks(prisma, demoOrgId);
  await seedDemoEnterprise(prisma);
  await seedDemoEnterpriseP2(prisma);
  await seedDemoEnterpriseP3(prisma);
  await seedDemoEnterpriseP4(prisma);
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
