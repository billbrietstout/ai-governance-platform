/**
 * Seed orchestrator – frameworks, verticals, demo, demo-enterprise.
 */
import { PrismaClient } from "@prisma/client";

import { seedDemo } from "./demo";
import { seedDemoEnterprise } from "./demo-enterprise";
import { seedDemoEnterpriseP2 } from "./demo-enterprise-p2";
import { seedDemoEnterpriseP3 } from "./demo-enterprise-p3";
import { seedDemoEnterpriseP4 } from "./demo-enterprise-p4";
import { seedDemoLayer2 } from "./demo-layer2";
import { seedDemoPhases48 } from "./demo-phases4-8";
import { seedFrameworks } from "./frameworks";
import { seedRegulationCascadeChain } from "./regulation-cascade-chain";
import { seedNotificationPrefs } from "./seed-notification-prefs";

const prisma = new PrismaClient();

async function main() {
  const demoOrgId = await seedDemo(prisma);
  await seedFrameworks(prisma, demoOrgId);
  await seedRegulationCascadeChain(prisma, demoOrgId);
  const prefsCreated = await seedNotificationPrefs(prisma);
  if (prefsCreated > 0) {
    // eslint-disable-next-line no-console
    console.log(`Created ${prefsCreated} notification preference(s) for existing users.`);
  }
  await seedDemoEnterprise(prisma);
  await seedDemoEnterpriseP2(prisma);
  await seedDemoEnterpriseP3(prisma);
  await seedDemoEnterpriseP4(prisma);
  await seedDemoLayer2(prisma);
  await seedDemoPhases48(prisma);
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
