"use client";

import { useState, useEffect } from "react";
import { Megaphone, Send, Clock, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardHeader, Button } from "@/components/ui/shared";
import { formatDate } from "@/lib/utils";

export default function NotificationsClient() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/super-admin/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      setNotifications(data);
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async (e: any) => {
    e.preventDefault();
    if (!title || !message) return showToast("Title and message are required", "info");

    setSending(true);
    try {
      const res = await fetch("/api/super-admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, type: "INFO" })
      });
      if (!res.ok) throw new Error("Failed to send broadcast");
      showToast("Global notification sent successfully!", "success");
      setTitle("");
      setMessage("");
      fetchNotifications();
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setSending(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "WARNING": return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "SUCCESS": return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Megaphone className="h-8 w-8 text-primary" />
          Global Notifications
        </h2>
        <p className="text-muted-foreground mt-1">
          Broadcast messages and alerts to all vendors on the platform
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm h-fit">
          <CardHeader title="New Broadcast" description="Send a system-wide notice to all users" />
          <div className="p-6">
            <form onSubmit={handleBroadcast} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">Notice Title</label>
                <input 
                  id="title" 
                  placeholder="e.g. Scheduled Maintenance" 
                  value={title}
                  onChange={(e: any) => setTitle(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">Message Body</label>
                <textarea 
                  id="message" 
                  placeholder="Details about the notification..." 
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 resize-y"
                  value={message}
                  onChange={(e: any) => setMessage(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={sending || !title || !message}>
                {sending ? "Broadcasting..." : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send to All Vendors
                  </>
                )}
              </Button>
            </form>
          </div>
        </Card>

        <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader title="Recent Broadcasts" description="History of global notifications" />
          <div className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground animate-pulse">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No broadcasts sent yet.</div>
            ) : (
              <div className="divide-y divide-border/50">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 bg-background rounded-full p-1 border border-border/50 shadow-sm">
                        {getTypeIcon(notif.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium leading-none">{notif.title}</h4>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(notif.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{notif.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-[9999] max-w-sm w-full bg-card/90 backdrop-blur-md border border-border/85 rounded-xl p-4 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            {toast.type === "success" && (
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 flex-shrink-0">
                <CheckCircle className="h-5 w-5" />
              </div>
            )}
            {toast.type === "error" && (
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 flex-shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
            )}
            {toast.type === "info" && (
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0">
                <Info className="h-5 w-5" />
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {toast.type === "success" ? "Success" : toast.type === "error" ? "Error" : "Notification"}
              </p>
              <p className="text-sm text-muted-foreground">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-muted-foreground hover:text-foreground text-lg leading-none">
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
