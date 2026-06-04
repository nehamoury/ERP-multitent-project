const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.subscriptionPlan.findMany();
  console.log("PLANS:", JSON.stringify(plans, null, 2));

  const subs = await prisma.vendorSubscription.findMany({ include: { plan: true } });
  console.log("SUBS:", JSON.stringify(subs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
