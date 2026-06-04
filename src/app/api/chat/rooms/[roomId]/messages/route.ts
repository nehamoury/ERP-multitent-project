import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MessageType } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { vendorId, id: userId } = session.user;
    const { roomId } = params;

    // Verify room access and vendor isolation
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        roomId_userId_vendorId: {
          roomId,
          userId,
          vendorId
        }
      }
    });

    if (!participant) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const cursor = searchParams.get('cursor');
    const limit = 50;

    const messages = await prisma.message.findMany({
      where: {
        roomId,
        vendorId,
      },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          }
        },
        reads: {
          select: {
            userId: true,
            readAt: true,
          }
        }
      }
    });

    let nextCursor: string | null = null;
    if (messages.length === limit) {
      nextCursor = messages[messages.length - 1].id;
    }

    return NextResponse.json({
      items: messages.reverse(), // Send in chronological order
      nextCursor
    });

  } catch (error) {
    console.error('CHAT_MESSAGES_GET_ERROR', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { vendorId, id: userId } = session.user;
    const { roomId } = params;
    
    // Validate access
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        roomId_userId_vendorId: {
          roomId,
          userId,
          vendorId
        }
      }
    });

    if (!participant) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body = await req.json();
    const { content, messageType = 'TEXT', fileUrl, fileName, fileSize, replyToId } = body;

    if (!content && !fileUrl) {
      return new NextResponse('Message content or file is required', { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        roomId,
        vendorId,
        senderId: userId,
        messageType: messageType as MessageType,
        content,
        fileUrl,
        fileName,
        fileSize,
        replyToId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          }
        },
        reads: {
          select: {
            userId: true,
            readAt: true,
          }
        }
      }
    });

    // Automatically mark as read by sender
    await prisma.messageRead.create({
      data: {
        vendorId,
        messageId: message.id,
        userId: userId,
      }
    });

    // Create notifications for other participants
    const otherParticipants = await prisma.chatParticipant.findMany({
      where: { roomId, vendorId, userId: { not: userId } },
      select: { userId: true }
    });

    if (otherParticipants.length > 0) {
      const title = `New Message from ${session.user.name}`;
      const msgPreview = content ? (content.length > 50 ? content.substring(0, 50) + '...' : content) : 'Sent an attachment';
      
      const notifications = otherParticipants.map(p => ({
        vendorId,
        userId: p.userId,
        title,
        message: msgPreview,
        type: 'info',
      }));

      await prisma.notification.createMany({
        data: notifications
      });

      // Trigger socket webhook for notifications
      const socketUrl = process.env.INTERNAL_SOCKET_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3002';
      if (socketUrl) {
        const userChannels = otherParticipants.map(p => `private-vendor-${vendorId}-user-${p.userId}`);
        fetch(`${socketUrl}/api/internal/webhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'new-notification',
            channel: userChannels,
            data: notifications[0], // send a representative notification object
            secret: process.env.SOCKET_SECRET,
          }),
        }).catch(err => console.error('Failed to trigger notification webhook:', err));
      }
    }

    // Trigger internal Webhook to new Socket Server
    const channelName = `private-vendor-${vendorId}-room-${roomId}`;
    const socketUrl = process.env.INTERNAL_SOCKET_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3002';
    
    if (socketUrl) {
      try {
        const webhookRes = await fetch(`${socketUrl}/api/internal/webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'new-message',
            channel: channelName,
            data: message,
            secret: process.env.SOCKET_SECRET,
          }),
        });
        if (!webhookRes.ok) {
          console.error('Webhook returned error:', await webhookRes.text());
        }
      } catch (err) {
        console.error('Failed to trigger socket webhook:', err);
      }
    }

    return NextResponse.json(message);

  } catch (error) {
    console.error('CHAT_MESSAGES_POST_ERROR', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
