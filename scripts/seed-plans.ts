import { PrismaClient } from '../node_modules/.prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding subscription plans...')

  const plans = [
    {
      name: 'FREE' as const,
      priceMonthly: 0,
      priceYearly: 0,
      maxEmployees: 10,
      features: ['Attendance', 'Employee Management'],
    },
    {
      name: 'STARTER' as const,
      priceMonthly: 499,
      priceYearly: 4990,
      maxEmployees: 50,
      features: ['Attendance', 'Employee Management', 'Leave Management', 'Mobile App'],
    },
    {
      name: 'PRO' as const,
      priceMonthly: 1499,
      priceYearly: 14990,
      maxEmployees: 200,
      features: [
        'Attendance',
        'Employee Management',
        'Leave Management',
        'Payroll',
        'Reports (Advanced)',
        'Mobile App',
        'API Access',
        'Multi Branch',
      ],
    },
    {
      name: 'ENTERPRISE' as const,
      priceMonthly: 4999,
      priceYearly: 49990,
      maxEmployees: 999999, // Unlimited
      features: [
        'Attendance',
        'Employee Management',
        'Leave Management',
        'Payroll',
        'Reports (Advanced)',
        'Mobile App',
        'API Access',
        'Multi Branch',
        'Custom Branding',
      ],
    },
  ]

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    })
  }

  console.log('Plans seeded successfully.')

  // Assign existing vendors to FREE plan if they don't have a subscription
  const freePlan = await prisma.subscriptionPlan.findUnique({
    where: { name: 'FREE' },
  })

  if (freePlan) {
    const vendorsWithoutSubscription = await prisma.vendor.findMany({
      where: { subscription: null },
    })

    const now = new Date()
    const trialEndsAt = new Date()
    trialEndsAt.setDate(now.getDate() + 14) // 14 days trial

    for (const vendor of vendorsWithoutSubscription) {
      await prisma.vendorSubscription.create({
        data: {
          vendorId: vendor.id,
          planId: freePlan.id,
          status: 'TRIAL',
          trialEndsAt: trialEndsAt,
          currentPeriodStart: now,
          currentPeriodEnd: trialEndsAt,
        },
      })
      console.log(`Assigned trial FREE plan to vendor ${vendor.name}`)
    }
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
