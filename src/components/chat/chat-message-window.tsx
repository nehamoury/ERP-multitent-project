'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { ChatMessageInput } from './chat-message-input';
import { Message, User } from '@prisma/client';
import { cn, getAvatarColor } from '@/lib/utils';
import Image from 'next/image';

type MessageWithSender = Message & {
  sender: {
    id: string;
    name: string;
    profileImage: string | null;
  }
};

export const ChatMessageWindow = ({ roomId, currentUserId }: { roomId: string, currentUserId: string }) => {
  const { socket, joinRoom, leaveRoom } = useSocket();
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (roomId) {
      joinRoom(roomId);
      fetchRoomInfo();
      fetchMessages();
    }
    return () => {
      if (roomId) leaveRoom(roomId);
    };
  }, [roomId, joinRoom, leaveRoom]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: MessageWithSender) => {
      console.log(`[CLIENT AUDIT] Event 'new-message' received for roomId: ${message.roomId}`);
      if (message.roomId === roomId) {
        console.log(`[CLIENT AUDIT] State updating: appending message to React state.`);
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      } else {
        console.log(`[CLIENT AUDIT] Event ignored: message.roomId (${message.roomId}) !== current roomId (${roomId})`);
      }
    };

    socket.on('new-message', handleNewMessage);

    const handleUserTyping = ({ userId, roomId: typingRoomId }: any) => {
      if (typingRoomId === roomId && userId !== currentUserId) {
        setTypingUsers(prev => prev.includes(userId) ? prev : [...prev, userId]);
      }
    };

    const handleUserStopTyping = ({ userId, roomId: typingRoomId }: any) => {
      if (typingRoomId === roomId) {
        setTypingUsers(prev => prev.filter(id => id !== userId));
      }
    };

    socket.on('user-typing', handleUserTyping);
    socket.on('user-stop-typing', handleUserStopTyping);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-stop-typing', handleUserStopTyping);
    };
  }, [socket, roomId, currentUserId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.items || []);
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error('Failed to load messages', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomInfo = async () => {
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}`);
      if (res.ok) {
        const data = await res.json();
        setRoomInfo(data);
      }
    } catch (error) {
      console.error('Failed to load room info', error);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  if (!roomId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/5">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">Select a chat</p>
          <p className="text-sm">Choose a conversation from the sidebar to start messaging.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      <div className="p-4 border-b flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-sm text-lg",
            roomInfo?.type === 'DIRECT' 
              ? getAvatarColor(roomInfo.participants.find((p: any) => p.userId !== currentUserId)?.user?.name || '')
              : "bg-gradient-to-br from-primary/80 to-primary"
          )}>
            {roomInfo?.type === 'DIRECT' ? (
              roomInfo.participants.find((p: any) => p.userId !== currentUserId)?.user?.name?.charAt(0) || '#'
            ) : '#'}
          </div>
          <div>
            <h3 className="font-semibold">
              {roomInfo?.type === 'DIRECT'
                ? roomInfo.participants.find((p: any) => p.userId !== currentUserId)?.user?.name || 'Direct Chat'
                : roomInfo?.name || 'Chat Room'}
            </h3>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
            </p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center p-4"><span className="animate-pulse">Loading messages...</span></div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground mt-10">No messages yet. Say hi!</div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUserId;
            const showAvatar = !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);

            return (
              <div key={msg.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                <div className={cn("flex max-w-[70%] gap-2", isMe ? "flex-row-reverse" : "flex-row")}>
                  {showAvatar ? (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {msg.sender.profileImage ? (
                        <Image src={msg.sender.profileImage} alt={msg.sender.name} width={32} height={32} />
                      ) : (
                        <span className="text-xs font-medium">{msg.sender.name.charAt(0)}</span>
                      )}
                    </div>
                  ) : (
                    !isMe && <div className="w-8 flex-shrink-0" />
                  )}

                  <div className={cn(
                    "px-4 py-2.5 rounded-2xl shadow-sm border",
                    isMe
                      ? "bg-primary text-primary-foreground rounded-tr-sm border-primary"
                      : "bg-white dark:bg-slate-800 text-foreground rounded-tl-sm border-black/5 dark:border-white/5"
                  )}>
                    {!isMe && showAvatar && <p className="text-xs font-medium mb-1 opacity-70">{msg.sender.name}</p>}
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className={cn(
                      "text-[10px] mt-1 text-right",
                      isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground text-xs p-2">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
            Someone is typing...
          </div>
        )}
      </div>

      <ChatMessageInput roomId={roomId} />
    </div>
  );
};
