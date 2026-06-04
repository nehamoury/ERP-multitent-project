'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Hash, Lock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatRoom, ChatRoomType, Message } from '@prisma/client';
import { NewChatDialog } from './new-chat-dialog';
import { useSocket } from '@/hooks/useSocket';

export const ChatSidebar = ({ vendorId, userId }: { vendorId: string, userId: string }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRoomId = searchParams.get('room');
  
  const [rooms, setRooms] = useState<(ChatRoom & { messages?: Message[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  
  const { socket, joinMultipleRooms } = useSocket();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch('/api/chat/rooms');
        if (response.ok) {
          const data = await response.json();
          setRooms(data);
          
          // Auto-subscribe to all rooms
          const roomIds = data.map((r: any) => r.id);
          if (roomIds.length > 0) {
            joinMultipleRooms(roomIds);
          }
        }
      } catch (error) {
        console.error('Failed to fetch rooms', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
    // Removed 5-second polling interval
  }, [joinMultipleRooms]);

  // Handle incoming socket messages globally
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: any) => {
      const roomId = message.roomId;
      
      // Update room order and latest message preview
      setRooms(prevRooms => {
        const roomIndex = prevRooms.findIndex(r => r.id === roomId);
        if (roomIndex === -1) return prevRooms; // Ignore if room not in list

        const updatedRoom = { ...prevRooms[roomIndex] };
        updatedRoom.messages = [message]; // Update latest message

        // Move updated room to the top
        const newRooms = [...prevRooms];
        newRooms.splice(roomIndex, 1);
        return [updatedRoom, ...newRooms];
      });

      // Handle unread counts
      if (roomId !== currentRoomId) {
        setUnreadCounts(prev => ({
          ...prev,
          [roomId]: (prev[roomId] || 0) + 1
        }));
      }
    };

    const handleNewRoom = (roomData: any) => {
      console.log(`[CLIENT AUDIT] Event 'new-room' received for roomId: ${roomData.id}`);
      setRooms(prev => {
        // Prevent duplicates
        if (prev.some(r => r.id === roomData.id)) return prev;
        return [roomData, ...prev];
      });
      // Immediately subscribe to the new room's socket channel
      joinMultipleRooms([roomData.id]);
    };

    socket.on('new-message', handleNewMessage);
    socket.on('new-room', handleNewRoom);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('new-room', handleNewRoom);
    };
  }, [socket, currentRoomId, joinMultipleRooms]);

  // Reset unread count when room is opened
  useEffect(() => {
    if (currentRoomId) {
      setUnreadCounts(prev => {
        if (prev[currentRoomId]) {
          const newCounts = { ...prev };
          delete newCounts[currentRoomId];
          return newCounts;
        }
        return prev;
      });
    }
  }, [currentRoomId]);

  const selectRoom = (roomId: string) => {
    router.push(`?room=${roomId}`);
  };

  const getRoomIcon = (type: ChatRoomType) => {
    switch (type) {
      case 'DIRECT': return <Lock className="w-4 h-4" />;
      case 'GROUP': return <Users className="w-4 h-4" />;
      default: return <Hash className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-80 border-r bg-muted/10 h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Messages</h2>
          <NewChatDialog />
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search chats..."
            className="w-full pl-8 pr-4 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground text-sm">Loading chats...</div>
        ) : rooms.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">No chats found.</div>
        ) : (
          <div className="space-y-1">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => selectRoom(room.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                  currentRoomId === room.id 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full bg-background",
                  currentRoomId === room.id ? "text-primary" : "text-muted-foreground"
                )}>
                  {getRoomIcon(room.type)}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">
                      {room.type === 'DIRECT' 
                        ? (room as any).participants?.find((p: any) => p.userId !== userId)?.user?.name || "Direct Chat"
                        : room.name || "Chat Room"}
                    </p>
                    {unreadCounts[room.id] && unreadCounts[room.id] > 0 && (
                      <span className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full min-w-[20px] text-center">
                        {unreadCounts[room.id]}
                      </span>
                    )}
                  </div>
                  <p className={cn(
                    "text-xs truncate",
                    currentRoomId === room.id ? "text-primary-foreground/80" : "text-muted-foreground",
                    unreadCounts[room.id] ? "font-semibold text-foreground" : ""
                  )}>
                    {room.messages && room.messages.length > 0 
                      ? (room.messages[0].content ? room.messages[0].content : 'Attachment') 
                      : room.type}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
