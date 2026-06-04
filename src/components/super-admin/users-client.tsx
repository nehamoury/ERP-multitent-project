"use client";

import { useState, useEffect } from "react";
import { Users, Search, Filter, Mail, ShieldAlert, CheckCircle2, AlertTriangle, MoreVertical } from "lucide-react";
import { Card, CardHeader, Badge, RoleBadge, Button } from "@/components/ui/shared";
import { formatDate } from "@/lib/utils";
import { getInitials, getAvatarColor } from "@/lib/utils";
import { useSession } from "next-auth/react";

export default function UsersClient() {
  const { update } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/super-admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.vendor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const impersonateUser = async (userId: string) => {
    try {
      const res = await fetch("/api/super-admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to impersonate");
      }
      const data = await res.json();
      
      // Trigger NextAuth token update with the target user's details
      await update({ impersonateUserId: data.user.id });
      
      // Redirect to the correct path depending on target role
      const role = data.user.role;
      const redirectPath = role === "ADMIN" ? "/admin" : role === "HR" ? "/hr" : "/employee";
      window.location.href = redirectPath;
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading global users...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Global Users
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage all users across all vendors
          </p>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 border-b border-border/50 bg-muted/20">
          <h3 className="text-lg font-medium">User Directory</h3>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search users..."
                className="flex h-10 w-full rounded-md border border-input bg-background/50 pl-8 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="md" className="shrink-0 border-border/50">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Vendor</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Joined</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white font-medium ${getAvatarColor(user.name)} shadow-sm`}>
                            {getInitials(user.name)}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{user.vendor?.name || "Unknown"}</div>
                      </td>
                      <td className="px-6 py-4">
                        {user.isActive ? (
                          <Badge label="Active" />
                        ) : (
                          <Badge label="Inactive" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          className="h-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => impersonateUser(user.id)}
                        >
                          Login As
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
