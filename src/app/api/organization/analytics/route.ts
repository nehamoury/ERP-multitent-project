import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getAuth();
    if (!session?.user || !["ADMIN", "HR"].includes(session.user.role)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    
    const vendorId = session.user.vendorId;
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch all active and inactive users to calculate metrics
    const [
      allUsers, 
      activeUsers, 
      transfersThisMonth, 
      promotionsThisMonth,
      departments,
      branches
    ] = await Promise.all([
      prisma.user.findMany({ where: { vendorId }, select: { isActive: true, joinDate: true, departmentId: true, branchId: true } }),
      prisma.user.findMany({ where: { vendorId, isActive: true }, select: { id: true, departmentId: true, branchId: true } }),
      prisma.employeeTransfer.count({ where: { vendorId, createdAt: { gte: firstDayOfMonth } } }),
      prisma.promotionHistory.count({ where: { vendorId, createdAt: { gte: firstDayOfMonth } } }),
      prisma.department.findMany({ where: { vendorId, isActive: true }, select: { id: true, name: true } }),
      prisma.branch.findMany({ where: { vendorId, isActive: true }, select: { id: true, name: true } })
    ]);

    const totalHeadcount = activeUsers.length;
    
    // New Joiners this month
    const newJoiners = allUsers.filter(u => new Date(u.joinDate) >= firstDayOfMonth).length;
    
    // Simple Attrition Rate calculation (Resigned / Avg Headcount) for this example
    const resignedEmployees = allUsers.filter(u => !u.isActive).length;
    const attritionRate = totalHeadcount > 0 ? ((resignedEmployees / (totalHeadcount + resignedEmployees)) * 100).toFixed(1) : 0;
    
    // Average Tenure (in years)
    const tenuresInDays = allUsers.map(u => {
      const start = new Date(u.joinDate);
      const end = now;
      return (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
    });
    const avgTenureDays = tenuresInDays.length ? tenuresInDays.reduce((a,b) => a+b, 0) / tenuresInDays.length : 0;
    const avgTenureYears = (avgTenureDays / 365).toFixed(1);

    // Chart Data: Employees by Department
    const deptMap = new Map();
    departments.forEach(d => deptMap.set(d.id, { name: d.name, employees: 0 }));
    activeUsers.forEach(u => {
      if (u.departmentId && deptMap.has(u.departmentId)) {
        deptMap.get(u.departmentId).employees += 1;
      }
    });
    const employeesByDepartment = Array.from(deptMap.values()).filter(d => d.employees > 0);

    // Chart Data: Employees by Branch
    const branchMap = new Map();
    branches.forEach(b => branchMap.set(b.id, { name: b.name, employees: 0 }));
    activeUsers.forEach(u => {
      if (u.branchId && branchMap.has(u.branchId)) {
        branchMap.get(u.branchId).employees += 1;
      }
    });
    const employeesByBranch = Array.from(branchMap.values()).filter(b => b.employees > 0);

    const metrics = {
      headcount: totalHeadcount,
      departments: departments.length,
      newJoiners,
      resignedEmployees,
      attritionRate: `${attritionRate}%`,
      averageTenure: `${avgTenureYears} Years`,
      transfersThisMonth,
      promotionsThisMonth
    };

    const charts = {
      employeesByDepartment,
      employeesByBranch
    };

    return NextResponse.json({ success: true, data: { metrics, charts } });
  } catch (error: any) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
