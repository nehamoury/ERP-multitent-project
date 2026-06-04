const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const vendor = await prisma.vendor.findFirst();
  
  if (!vendor) {
    console.log("No vendor found to attach super admin to.");
    return;
  }

  const hashedPassword = await bcrypt.hash("super123", 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: "super@attendiq.com" },
    update: {
      role: "SUPER_ADMIN",
      password: hashedPassword
    },
    create: {
      vendorId: vendor.id,
      employeeId: "SA001",
      name: "Master Super Admin",
      email: "super@attendiq.com",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      isActive: true,
      joinDate: new Date(),
    },
  });

  console.log("✅ Super Admin created successfully!");
  console.log("Email: super@attendiq.com");
  console.log("Password: super123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
