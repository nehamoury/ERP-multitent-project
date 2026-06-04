'use client';

import { useSearchParams } from 'next/navigation';
import { ChatSidebar } from './chat-sidebar';
import { ChatMessageWindow } from './chat-message-window';
import { useSocket } from '@/hooks/useSocket';

interface ChatLayoutProps {
  vendorId: string;
  userId: string;
}

export const ChatLayout = ({ vendorId, userId }: ChatLayoutProps) => {
  const searchParams = useSearchParams();
  const roomId = searchParams.get('room');

  // Initialize socket hook at layout level so connection persists across room changes
  const { isConnected, error } = useSocket();

  return (
    <div className="flex h-[calc(100vh-8rem)] border rounded-xl overflow-hidden bg-background shadow-sm m-4">
      <ChatSidebar vendorId={vendorId} userId={userId} />

      <div className="flex-1 flex flex-col relative">

        {error && (
          <div className="absolute top-0 left-0 right-0 bg-destructive/10 text-destructive text-xs py-1 px-4 text-center z-50">
            Chat server disconnected. Trying to reconnect...
          </div>
        )}

        <ChatMessageWindow roomId={roomId || ''} currentUserId={userId} />
      </div>
    </div>
  );
};
