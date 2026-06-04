'use client';

import { useState } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';

export const ChatMessageInput = ({ roomId }: { roomId: string }) => {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { socket } = useSocket();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSending) return;

    setIsSending(true);
    try {
      // 1. Save to Next.js Database via REST
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        setContent('');
        // Next.js API handles broadcasting to Socket Gateway internally
      }
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
    if (socket) {
      socket.emit('typing', { roomId });

      // Debounce stop-typing
      // In a real app, use a proper debounce hook
      setTimeout(() => {
        socket.emit('stop-typing', { roomId });
      }, 2000);
    }
  };

  return (
    <form onSubmit={handleSend} className="p-4 border-t bg-background flex items-center gap-2">
      <button type="button" className="p-2 text-muted-foreground hover:text-foreground transition-colors">
        <Paperclip className="w-5 h-5" />
      </button>

      <div className="flex-1 relative">
        <input
          value={content}
          onChange={handleTyping}
          placeholder="Type a message..."
          className="w-full pl-4 pr-10 py-3 bg-muted rounded-full focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          disabled={isSending}
        />
        <button type="button" className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
          <Smile className="w-5 h-5" />
        </button>
      </div>

      <button
        type="submit"
        disabled={!content.trim() || isSending}
        className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        <Send className="w-5 h-5" />
      </button>
    </form>
  );
};
