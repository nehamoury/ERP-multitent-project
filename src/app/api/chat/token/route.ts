import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const secret = process.env.SOCKET_SECRET;
    if (!secret) {
      console.error('Missing SOCKET_SECRET environment variable');
      return new NextResponse('Server configuration error', { status: 500 });
    }

    // Generate a short-lived token valid for 5 minutes
    const token = jwt.sign(
      {
        userId: session.user.id,
        vendorId: session.user.vendorId,
        role: session.user.role,
      },
      secret,
      { expiresIn: '5m' }
    );

    return NextResponse.json({ token });

  } catch (error) {
    console.error('CHAT_TOKEN_GET_ERROR', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
