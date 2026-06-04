import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { ChatLayout } from "@/components/chat/chat-layout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages | HR Dashboard",
};

export default async function HRMessagesPage() {
  const session = await requireAuth(["HR"]);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="h-full flex-1">
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-hidden p-2">
          <ChatLayout vendorId={session.user.vendorId} userId={session.user.id} />
        </div>
      </div>
    </div>
  );
}
