import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { vendorId, id: userId } = session.user;

    const users = await prisma.user.findMany({
      where: {
        vendorId,
        isActive: true,
        id: {
          not: userId, // exclude self
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        department: { select: { name: true } },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(users);

  } catch (error) {
    console.error('CHAT_USERS_GET_ERROR', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
