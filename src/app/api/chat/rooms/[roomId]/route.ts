import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    const room = await prisma.chatRoom.findFirst({
      where: {
        id: roomId,
        vendorId,
        participants: { some: { userId } }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
              }
            }
          }
        }
      }
    });

    if (!room) {
      return new NextResponse('Not Found', { status: 404 });
    }

    return NextResponse.json(room);

  } catch (error) {
    console.error('CHAT_ROOM_GET_ERROR', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
