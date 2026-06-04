import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = params;
    const { vendorId, userId, secret } = await req.json();

    if (secret !== process.env.SOCKET_SECRET) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!vendorId || !userId) {
      return new NextResponse('Missing parameters', { status: 400 });
    }

    const participant = await prisma.chatParticipant.findUnique({
      where: {
        roomId_userId_vendorId: {
          roomId,
          userId,
          vendorId,
        }
      }
    });

    if (participant) {
      return NextResponse.json({ valid: true });
    } else {
      return NextResponse.json({ valid: false });
    }

  } catch (error) {
    console.error('ROOM_VALIDATE_POST_ERROR', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
