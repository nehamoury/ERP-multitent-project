import { Session } from "next-auth";

export function getRoleScope(user: Session["user"]) {
  if (user.role === "BRANCH_MANAGER" && user.branchId) {
    return {
      vendorId: user.vendorId,
      branchId: user.branchId,
    };
  }

  if (user.role === "ADMIN" || user.role === "HR") {
    return {
      vendorId: user.vendorId,
    };
  }

  // EMPLOYEE or fallback
  return {
    id: user.id,
  };
}
