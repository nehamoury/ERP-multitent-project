"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ChevronRight, ChevronDown, Building2, Users, UsersRound, User, Briefcase } from "lucide-react";
import { cn, getAvatarColor, getInitials } from "@/lib/utils";

type HierarchyNode = {
  id: string;
  name: string;
  type: "COMPANY" | "DEPARTMENT" | "TEAM" | "EMPLOYEE";
  head?: { id: string; name: string; employeeId: string };
  lead?: { id: string; name: string; employeeId: string };
  employeeId?: string;
  designation?: string;
  profileImage?: string;
  children?: HierarchyNode[];
};

const TreeNode = ({ node, level = 0 }: { node: HierarchyNode; level?: number }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const Icon = {
    COMPANY: Building2,
    DEPARTMENT: Users,
    TEAM: UsersRound,
    EMPLOYEE: User
  }[node.type] || User;

  const colors = {
    COMPANY: "bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30 text-blue-800 dark:text-blue-300 ring-1 ring-blue-500/20 shadow-sm",
    DEPARTMENT: "bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border-indigo-500/30 text-indigo-800 dark:text-indigo-300 ring-1 ring-indigo-500/20 shadow-sm",
    TEAM: "bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/30 text-purple-800 dark:text-purple-300 ring-1 ring-purple-500/20 shadow-sm",
    EMPLOYEE: "bg-card border-border/80 text-foreground ring-1 ring-border/30 shadow-sm hover:shadow-md hover:border-primary/30"
  }[node.type];

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 py-3 group relative z-10">
        {hasChildren ? (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-background border border-border shadow-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all z-20"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <div className="w-6 h-6 z-20" /> // spacer
        )}
        
        <div className={cn(
          "flex flex-col rounded-xl p-3.5 min-w-[280px] max-w-[320px] transition-all duration-200 backdrop-blur-sm",
          colors
        )}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-background/60 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
              <Icon size={18} className="opacity-80" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm leading-tight">{node.name}</span>
              <span className="text-[9px] uppercase tracking-wider opacity-70 font-bold mt-0.5">{node.type}</span>
            </div>
          </div>

          {(node.head || node.lead) && (
            <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10 flex items-center gap-2.5">
              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-inner", getAvatarColor((node.head || node.lead)!.name))}>
                {getInitials((node.head || node.lead)!.name)}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold">{(node.head || node.lead)!.name}</span>
                <span className="text-[10px] opacity-70 font-medium">{node.type === "DEPARTMENT" ? "Department Head" : "Team Lead"}</span>
              </div>
            </div>
          )}

          {node.type === "EMPLOYEE" && (
            <div className="mt-3 pt-2.5 border-t border-border flex items-center gap-2">
              <Briefcase size={13} className="opacity-50" />
              <span className="text-xs font-medium opacity-80">{node.designation || "No Designation"}</span>
              <span className="text-[10px] font-bold opacity-50 ml-auto bg-muted px-1.5 py-0.5 rounded">{node.employeeId}</span>
            </div>
          )}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="flex flex-col ml-[11px] pl-[29px] border-l-2 border-border/60 relative mb-2">
          {node.children!.map((child, index) => {
            const isLast = index === node.children!.length - 1;
            return (
              <div key={child.id} className="relative">
                {/* Horizontal connector from the vertical line to the child */}
                <div className="absolute -left-[29px] top-[26px] w-[29px] h-[2px] bg-border/60 rounded-r-full" />
                
                {/* 
                  If this is the last child, we need to hide the vertical line that extends 
                  below this child's horizontal connector. We do this by covering it up or 
                  by making the main vertical line stop early. 
                  A simple trick: add a background-colored div to mask the bottom of the border.
                */}
                {isLast && (
                  <div className="absolute -left-[31px] top-[28px] w-[4px] bottom-0 bg-card z-0" />
                )}
                
                <TreeNode node={child} level={level + 1} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function HierarchyClient() {
  const { data: hierarchy, isLoading, error } = useQuery({
    queryKey: ['org-hierarchy'],
    queryFn: async () => {
      const res = await fetch("/api/organization/hierarchy");
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return json.data as HierarchyNode;
    }
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-[500px]"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  }

  if (error || !hierarchy) {
    return (
      <div className="p-12 text-center border-2 border-dashed border-border rounded-xl bg-card text-muted-foreground flex flex-col items-center justify-center gap-3">
        <Users size={32} className="opacity-20" />
        <p>Failed to load organization hierarchy.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-8 overflow-x-auto min-h-[600px] shadow-sm relative">
      <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] pointer-events-none" />
      <div className="inline-block min-w-max pr-12 relative z-10">
        <TreeNode node={hierarchy} />
      </div>
    </div>
  );
}
