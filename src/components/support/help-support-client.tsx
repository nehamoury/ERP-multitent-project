"use client";

import { useState } from "react";
import { HelpCircle, Mail, Phone, BookOpen, MessageSquare, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HelpSupportClient() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Attendance Issue");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      showToast("Please provide both subject and message.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, category, message }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to submit ticket");
      }

      showToast("Ticket submitted successfully!");
      setSubject("");
      setMessage("");
      // router.refresh(); // Not strictly needed here, but good for resetting state if needed
    } catch (error: any) {
      showToast(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl w-full mx-auto space-y-6 pb-12">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <HelpCircle size={20} />
          </div>
          Help & Support
        </h1>
        <p className="text-muted-foreground mt-1 ml-13 pl-13">
          Get assistance and answers to your questions
        </p>
      </div>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
            <Mail size={24} />
          </div>
          <h3 className="font-bold mb-1">Email Support</h3>
          <p className="text-xs text-muted-foreground mb-4">Get a response within 24 hours</p>
          <a href="mailto:support@attendiq.com" className="text-sm font-medium text-primary hover:underline">
            support@attendiq.com
          </a>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4">
            <Phone size={24} />
          </div>
          <h3 className="font-bold mb-1">Phone Support</h3>
          <p className="text-xs text-muted-foreground mb-4">Available Mon-Fri, 9am - 6pm</p>
          <span className="text-sm font-medium">
            +1 (800) 123-4567
          </span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
            <BookOpen size={24} />
          </div>
          <h3 className="font-bold mb-1">Documentation</h3>
          <p className="text-xs text-muted-foreground mb-4">Read our comprehensive guides</p>
          <button className="text-sm font-medium flex items-center gap-1.5 transition-colors hover:text-primary">
            Browse Docs <ExternalLink size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* FAQs */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-fit">
          <h2 className="text-lg font-bold mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-bold text-sm mb-1.5">How do I mark my attendance?</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You can mark your attendance using the QR Scanner for on-site check-ins or the Scan & Attend feature on your dashboard.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-sm mb-1.5">Can I apply for leave via the app?</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Yes, go to the 'Leaves' section in the sidebar to view your balance and submit new leave requests.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-sm mb-1.5">Where can I find my payslips?</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your processed payslips are available under the 'My Payroll' or 'Payroll' section once disbursed.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Ticket Form */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
            <MessageSquare size={18} className="text-primary" /> Submit a Ticket
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Subject</label>
              <input
                type="text"
                placeholder="Explain the issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-1.5 block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
              >
                <option value="Attendance Issue">Attendance Issue</option>
                <option value="Payroll Issue">Payroll Issue</option>
                <option value="Leave Request Issue">Leave Request Issue</option>
                <option value="Technical Bug">Technical Bug</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold mb-1.5 block">Message</label>
              <textarea
                placeholder="Describe your problem in detail"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
              Submit Ticket
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
