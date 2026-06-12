// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const DEPTS = ["Engineering", "Design", "Marketing", "Finance", "HR", "Sales"];
const DESIGNATIONS = {
  Engineering: ["Senior Engineer", "Backend Developer", "Frontend Developer", "DevOps Engineer"],
  Design: ["UI/UX Designer", "Graphic Designer", "Product Designer"],
  Marketing: ["Marketing Manager", "Content Writer", "SEO Specialist"],
  Finance: ["Accountant", "Financial Analyst", "CFO"],
  HR: ["HR Manager", "Recruiter", "HR Executive"],
  Sales: ["Sales Manager", "Account Executive", "Sales Rep"],
};

const FIRST_NAMES = ["Aarav", "Arjun", "Priya", "Sneha", "Rahul", "Neha", "Vikram", "Pooja", "Rajesh", "Kavya", "Amit", "Divya", "Sanjay", "Riya", "Ankit"];
const LAST_NAMES = ["Sharma", "Patel", "Singh", "Verma", "Gupta", "Kumar", "Shah", "Joshi", "Mehta", "Malhotra", "Kapoor", "Nair", "Reddy", "Rao", "Iyer"];

function randItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pad(n) { return String(n).padStart(2, "0"); }

async function main() {
  console.log("🌱 Seeding database...");

  // Create a Vendor
  const vendor = await prisma.vendor.upsert({
    where: { slug: "attendiq" },
    update: {},
    create: {
      name: "AttendIQ Corp",
      slug: "attendiq",
      email: "admin@attendiq.com",
      status: "ACTIVE",
    },
  });

  // Company settings
  await prisma.companySettings.upsert({
    where: { vendorId: vendor.id },
    update: {},
    create: {
      vendorId: vendor.id,
      companyName: "AttendIQ Corp",
      workingHoursStart: "09:00",
      workingHoursEnd: "18:00",
      lateThreshold: 15,
      timezone: "Asia/Kolkata",
    },
  });

  // Seed Subscription Plans
  console.log("💳 Seeding Subscription Plans...");
  const plans = [
    {
      name: "FREE",
      priceMonthly: 0,
      priceYearly: 0,
      maxEmployees: 5,
      features: ["Attendance", "Leave Management", "Notice Board"],
    },
    {
      name: "STARTER",
      priceMonthly: 999,
      priceYearly: 9990,
      maxEmployees: 20,
      features: ["Attendance", "Leave Management", "Notice Board", "Basic Reports", "QR Scanner"],
    },
    {
      name: "PRO",
      priceMonthly: 2999,
      priceYearly: 29990,
      maxEmployees: 100,
      features: ["Attendance", "Leave Management", "Advanced Reports", "QR Scanner", "Payroll", "Work Reports", "Projects"],
    },
    {
      name: "ENTERPRISE",
      priceMonthly: 9999,
      priceYearly: 99990,
      maxEmployees: 1000,
      features: ["Attendance", "Leave Management", "Advanced Reports", "QR Scanner", "Payroll", "Work Reports", "Projects", "Invoices", "API Access", "Multi Branch", "Custom Branding"],
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
  }

  const freePlan = await prisma.subscriptionPlan.findUnique({ where: { name: "FREE" } });

  // Assign Free Subscription to Vendor
  await prisma.vendorSubscription.upsert({
    where: { vendorId: vendor.id },
    update: {},
    create: {
      vendorId: vendor.id,
      planId: freePlan.id,
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    },
  });

  // Create Organization Structure
  const branch = await prisma.branch.upsert({
    where: { name_vendorId: { name: "Head Office", vendorId: vendor.id } },
    update: {},
    create: { vendorId: vendor.id, name: "Head Office", code: "HQ", location: "Mumbai" },
  });

  const deptRecords = {};
  for (const deptName of DEPTS) {
    const dept = await prisma.department.upsert({
      where: { name_vendorId: { name: deptName, vendorId: vendor.id } },
      update: {},
      create: { vendorId: vendor.id, name: deptName, branchId: branch.id, code: deptName.slice(0, 3).toUpperCase() },
    });
    deptRecords[deptName] = dept;
  }

  const desigRecords = {};
  for (const [deptName, titles] of Object.entries(DESIGNATIONS)) {
    for (const title of titles) {
      const desig = await prisma.designation.upsert({
        where: { name_departmentId: { name: title, departmentId: deptRecords[deptName].id } },
        update: {},
        create: { vendorId: vendor.id, departmentId: deptRecords[deptName].id, name: title },
      });
      desigRecords[title] = desig;
    }
  }

  const hashedPassword = await bcrypt.hash("password123", 12);

  // Admin
  const adminDept = deptRecords["Engineering"];
  const adminDesig = desigRecords["Senior Engineer"];
  const admin = await prisma.user.upsert({
    where: { email: "admin@attendiq.com" },
    update: {},
    create: {
      vendorId: vendor.id,
      employeeId: "EMP001",
      name: "Admin User",
      email: "admin@attendiq.com",
      password: hashedPassword,
      role: "ADMIN",
      departmentId: adminDept.id,
      designationId: adminDesig.id,
      branchId: branch.id,
      phone: "+91-9000000001",
      joinDate: new Date("2020-01-15"),
    },
  });

  // HR
  const hrDept = deptRecords["HR"];
  const hrDesig = desigRecords["HR Manager"];
  const hr = await prisma.user.upsert({
    where: { email: "hr@attendiq.com" },
    update: {},
    create: {
      vendorId: vendor.id,
      employeeId: "EMP002",
      name: "HR Manager",
      email: "hr@attendiq.com",
      password: hashedPassword,
      role: "HR",
      departmentId: hrDept.id,
      designationId: hrDesig.id,
      branchId: branch.id,
      phone: "+91-9000000002",
      joinDate: new Date("2020-03-01"),
    },
  });

  // Sample employees
  const employees = [];
  for (let i = 3; i <= 20; i++) {
    const deptName = randItem(DEPTS);
    const firstName = randItem(FIRST_NAMES);
    const lastName = randItem(LAST_NAMES);
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@attendiq.com`;
    const employeeId = `EMP${pad(i)}`;
    const desigTitle = randItem(DESIGNATIONS[deptName]);

    const emp = await prisma.user.upsert({
      where: { vendorId_employeeId: { vendorId: vendor.id, employeeId } },
      update: { email, name, departmentId: deptRecords[deptName].id, designationId: desigRecords[desigTitle].id },
      create: {
        vendorId: vendor.id,
        employeeId,
        name,
        email,
        password: hashedPassword,
        role: "EMPLOYEE",
        departmentId: deptRecords[deptName].id,
        designationId: desigRecords[desigTitle].id,
        branchId: branch.id,
        phone: `+91-90${randInt(10000000, 99999999)}`,
        joinDate: new Date(2021 + Math.floor(i / 8), randInt(0, 11), randInt(1, 28)),
      },
    });
    employees.push(emp);
  }

  const allUsers = [admin, hr, ...employees];

  // Generate 30 days of attendance
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const date = new Date(today);
    date.setDate(today.getDate() - dayOffset);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends

    for (const user of allUsers) {
      const absent = Math.random() < 0.07;
      if (absent) continue;

      const isLate = Math.random() < 0.18;
      const checkInHour = 9;
      const checkInMin = isLate ? randInt(16, 55) : randInt(0, 14);
      const checkInDate = new Date(date);
      checkInDate.setHours(checkInHour, checkInMin, randInt(0, 59));

      const checkOutHour = randInt(17, 19);
      const checkOutMin = randInt(0, 59);
      const checkOutDate = new Date(date);
      checkOutDate.setHours(checkOutHour, checkOutMin, randInt(0, 59));

      const workingMs = checkOutDate - checkInDate;
      const workingHours = Math.max(0, workingMs / 3600000);

      await prisma.attendance.upsert({
        where: { userId_date: { userId: user.id, date } },
        update: {},
        create: {
          userId: user.id,
          vendorId: vendor.id,
          date,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          workingHours: parseFloat(workingHours.toFixed(2)),
          status: isLate ? "LATE" : "PRESENT",
          isLate,
          lateMinutes: isLate ? checkInMin - 0 : 0,
        },
      });
    }
  }

  // Sample leaves
  const leaveTypes = ["ANNUAL", "SICK", "CASUAL", "EMERGENCY"];
  const leaveStatuses = ["PENDING", "APPROVED", "REJECTED"];

  for (let i = 0; i < 15; i++) {
    const user = randItem(employees);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - randInt(1, 20));
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + randInt(0, 3));
    const totalDays = Math.max(1, Math.ceil((endDate - startDate) / 86400000) + 1);

    await prisma.leave.create({
      data: {
        userId: user.id,
        vendorId: vendor.id,
        approverId: hr.id,
        type: randItem(leaveTypes),
        status: randItem(leaveStatuses),
        startDate,
        endDate,
        totalDays,
        reason: randItem(["Medical appointment", "Family function", "Personal work", "Vacation", "Emergency"]),
      },
    }).catch(() => {});
  }

  // Sample audit logs
  const auditActions = ["CREATE", "UPDATE", "LOGIN", "CHECKIN", "CHECKOUT", "APPROVE"];
  for (let i = 0; i < 20; i++) {
    const actor = randItem(allUsers);
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        vendorId: vendor.id,
        action: randItem(auditActions),
        entityType: randItem(["User", "Attendance", "Leave"]),
        entityId: randItem(allUsers).id,
        description: randItem([
          "Updated attendance record",
          "Approved leave request",
          "Added new employee",
          "Modified shift timing",
          "Exported attendance report",
        ]),
      },
    });
  }

  console.log("✅ Seed complete!");
  console.log("\n🔑 Login Credentials:");
  console.log("   Admin: admin@attendiq.com / password123");
  console.log("   HR:    hr@attendiq.com / password123");
  console.log("   Emp:   aarav.sharma3@attendiq.com / password123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
