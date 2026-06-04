import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { vendorId, id: userId } = session.user;
    const { messageId } = params;

    // Verify message and access
    const message = await prisma.message.findUnique({
      where: {
        id: messageId,
        vendorId,
      },
      include: {
        room: {
          select: {
            id: true
          }
        }
      }
    });

    if (!message) {
      return new NextResponse('Not found', { status: 404 });
    }

    // Upsert read receipt
    const readReceipt = await prisma.messageRead.upsert({
      where: {
        messageId_userId_vendorId: {
          messageId,
          userId,
          vendorId,
        }
      },
      update: {
        readAt: new Date(),
      },
      create: {
        messageId,
        userId,
        vendorId,
      }
    });

    // Notify others via Webhook to Socket Gateway
    const channelName = `private-vendor-${vendorId}-room-${message.room.id}`;
    if (process.env.INTERNAL_SOCKET_URL) {
      await fetch(`${process.env.INTERNAL_SOCKET_URL}/api/internal/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'message-read',
          channel: channelName,
          data: {
            messageId,
            userId,
            readAt: readReceipt.readAt,
          },
          secret: process.env.SOCKET_SECRET,
        }),
      }).catch(err => console.error('Failed to trigger socket webhook', err));
    }

    return NextResponse.json(readReceipt);

  } catch (error) {
    console.error('CHAT_MESSAGES_READ_POST_ERROR', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
