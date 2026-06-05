// src/components/layout/topbar.tsx
"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Bell, Search, Check, Info, AlertTriangle, Calendar, User, Settings, ExternalLink, LogOut } from "lucide-react";
import { getInitials, getAvatarColor } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSocket } from "@/hooks/useSocket";

interface Props {
  user: { name: string; email: string; role: string; department?: string; designation?: string };
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

const iconStyles: Record<string, { bg: string; color: string; el: React.ElementType }> = {
  info: { bg: "bg-blue-500/10", color: "text-blue-500", el: Info },
  success: { bg: "bg-green-500/10", color: "text-green-500", el: Check },
  warning: { bg: "bg-amber-500/10", color: "text-amber-500", el: AlertTriangle },
  event: { bg: "bg-purple-500/10", color: "text-purple-500", el: Calendar },
};

import { UpgradeBanner } from "./UpgradeBanner";
import { GlobalSearch } from "./global-search";

export default function Topbar({ user }: Props) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef<number>(0);
  const queryClient = useQueryClient();
  const router = useRouter();

  const getBasePath = (role: string) => {
    if (role === 'SUPER_ADMIN') return '/super-admin';
    if (role === 'EMPLOYEE') return '/employee';
    if (role === 'HR') return '/hr';
    return '/admin';
  };



  // Play notification sound using Web Audio API
  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      // First tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.frequency.setValueAtTime(830, ctx.currentTime);
      osc1.type = "sine";
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.3);

      // Second tone (higher pitch, slight delay for pleasant "ding-dong")
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.setValueAtTime(1046, ctx.currentTime + 0.15);
      osc2.type = "sine";
      gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.5);

      setTimeout(() => ctx.close(), 600);
    } catch (e) {
      // Audio not supported or blocked
    }
  };

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications');
      const json = await res.json();
      return json.notifications as Notification[];
    },
    // Removed refetchInterval, now socket-driven
  });

  const notifications = data || [];
  
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    
    const handleNewNotification = (notificationData: any) => {
      // Play sound immediately on receiving socket event
      playNotificationSound();
      // Invalidate query to fetch the latest notification data
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    socket.on('new-notification', handleNewNotification);
    
    return () => {
      socket.off('new-notification', handleNewNotification);
    };
  }, [socket, queryClient]);

  const markReadMutation = useMutation({
    mutationFn: async ({ id, markAllRead }: { id?: string; markAllRead?: boolean }) => {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, markAllRead })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = () => {
    markReadMutation.mutate({ markAllRead: true });
  };

  const markRead = (id: string) => {
    markReadMutation.mutate({ id });
  };

  return (
    <>
      <UpgradeBanner />
      <header className="h-16 border-b border-border bg-card px-8 flex items-center justify-between gap-8 flex-shrink-0">
        {/* Search */}
      <div className="flex-1 max-w-md">
        <button
          onClick={() => setGlobalSearchOpen(true)}
          className="relative w-full flex items-center gap-2 pl-3 pr-4 py-2 text-sm bg-muted rounded-lg border-0 text-muted-foreground hover:bg-muted/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <Search size={16} />
          <span>Search employees, records…</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-5">
        {/* Clock */}
        <div className="hidden md:flex flex-col items-end text-right">
          <span className="text-sm font-semibold font-display tabular-nums">
            {mounted ? formatTime(currentTime) : "--:--:--"}
          </span>
          <span className="text-xs text-muted-foreground">
            {mounted ? formatDate(currentTime) : ""}
          </span>
        </div>

        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-96 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div>
                  <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
                  <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-96 overflow-y-auto divide-y divide-border">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const style = iconStyles[notif.type] || iconStyles.info;
                    const Icon = style.el;
                    return (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (!notif.isRead) markRead(notif.id);
                        }}
                        className={cn(
                          "flex gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-muted/60",
                          !notif.isRead && "bg-primary/5"
                        )}
                      >
                        <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5", style.bg)}>
                          <Icon size={16} className={style.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground truncate">{notif.title}</p>
                            {!notif.isRead && (
                              <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notif.message}</p>
                          <p className="text-[11px] text-muted-foreground/70 mt-1">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-border bg-muted/30 text-center">
                <button className="text-xs text-primary hover:underline font-medium">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User avatar & Dropdown */}
      <div className="relative pl-6 border-l border-border" ref={profileRef}>
        <button 
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none"
        >
          <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold", getAvatarColor(user.name))}>
            {getInitials(user.name)}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-semibold leading-none">{user.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[100px]">{user.designation || user.role}</div>
          </div>
        </button>

        {profileOpen && (
          <div className="absolute right-0 top-full mt-3 w-64 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-border flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0", getAvatarColor(user.name))}>
                {getInitials(user.name)}
              </div>
              <div className="overflow-hidden">
                <div className="font-semibold text-sm truncate">{user.name}</div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              </div>
            </div>
            
            <div className="p-2">
              <div className="px-3 py-1.5 mb-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Role</span>
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary">
                    {user.role}
                  </span>
                </div>
              </div>
              
              <div className="h-px bg-border my-1" />
              
              <button 
                onClick={() => { setProfileOpen(false); router.push('/profile'); }}
                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted flex items-center gap-2 transition-colors"
              >
                <User size={16} className="text-muted-foreground" /> View Profile
              </button>
              
              <button 
                onClick={() => { setProfileOpen(false); router.push('/settings'); }}
                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted flex items-center gap-2 transition-colors"
              >
                <Settings size={16} className="text-muted-foreground" /> Account Settings
              </button>
              
              <button 
                onClick={() => { setProfileOpen(false); router.push(`/help-support`); }}
                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted flex items-center gap-2 transition-colors"
              >
                <ExternalLink size={16} className="text-muted-foreground" /> Help & Support
              </button>
              
              <div className="h-px bg-border my-1" />
              
              <button 
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 flex items-center gap-2 transition-colors text-red-500"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
    <GlobalSearch userRole={user.role} open={globalSearchOpen} setOpen={setGlobalSearchOpen} />
    </>
  );
}
