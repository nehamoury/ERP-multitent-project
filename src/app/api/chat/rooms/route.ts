import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ChatRoomType } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { vendorId, id: userId, role } = session.user;

    let whereClause: any = {
      vendorId,
    };

    if (role === 'ADMIN') {
      // Admin gets full tenant chat access (all rooms)
    } else if (role === 'HR') {
      whereClause.type = { in: ['DIRECT', 'GROUP', 'DEPARTMENT'] };
      whereClause.participants = { some: { userId } };
    } else {
      // EMPLOYEE and others
      whereClause.type = { in: ['DIRECT', 'GROUP', 'PROJECT'] };
      whereClause.participants = { some: { userId } };
    }

    // Fetch rooms based on RBAC rules
    const rooms = await prisma.chatRoom.findMany({
      where: whereClause,
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(rooms);

  } catch (error) {
    console.error('CHAT_ROOMS_GET_ERROR', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { vendorId, id: userId } = session.user;
    const body = await req.json();
    const { name, type, participantIds, projectId, departmentId, teamId } = body;

    if (!type || !participantIds || !Array.isArray(participantIds)) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    let finalParticipantIds = Array.isArray(participantIds) ? [...participantIds] : [];
    let finalRoomName = name;

    // Check for existing PROJECT room and auto-add members
    if (type === 'PROJECT' && projectId) {
      const existingProjectRoom = await prisma.chatRoom.findFirst({
        where: { vendorId, type: 'PROJECT', projectId }
      });
      if (existingProjectRoom) {
        return NextResponse.json(existingProjectRoom);
      }

      // Fetch project members and manager
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: true }
      });
      if (project) {
        const projMemberIds = project.members.map((m: any) => m.id);
        finalParticipantIds = [...finalParticipantIds, project.managerId, ...projMemberIds];
        finalRoomName = project.name;
      }
    }

    // Check for existing DEPARTMENT room and auto-add members
    if (type === 'DEPARTMENT' && departmentId) {
      const existingDeptRoom = await prisma.chatRoom.findFirst({
        where: { vendorId, type: 'DEPARTMENT', departmentId }
      });
      if (existingDeptRoom) {
        return NextResponse.json(existingDeptRoom);
      }

      // Fetch department members
      const department = await prisma.department.findUnique({
        where: { id: departmentId },
        include: { users: true }
      });
      if (department) {
        const deptMemberIds = department.users.map((u: any) => u.id);
        finalParticipantIds = [...finalParticipantIds, ...deptMemberIds];
        if (department.headId) finalParticipantIds.push(department.headId);
        finalRoomName = department.name;
      }
    }

    // Include the creator in participants and remove duplicates
    const allParticipantIds = Array.from(new Set([...finalParticipantIds, userId]));

    // If DIRECT chat, check if it already exists
    if (type === 'DIRECT' && allParticipantIds.length === 2) {
      const existingRoom = await prisma.chatRoom.findFirst({
        where: {
          vendorId,
          type: 'DIRECT',
          AND: [
            { participants: { some: { userId: allParticipantIds[0] } } },
            { participants: { some: { userId: allParticipantIds[1] } } },
          ]
        }
      });

      if (existingRoom) {
        return NextResponse.json(existingRoom);
      }
    }

    // Create the room
    const newRoom = await prisma.chatRoom.create({
      data: {
        vendorId,
        name: type === 'DIRECT' ? null : finalRoomName,
        type: type as ChatRoomType,
        projectId,
        departmentId,
        teamId,
        createdBy: userId,
        participants: {
          create: allParticipantIds.map(pid => ({
            vendorId,
            userId: pid,
            isAdmin: pid === userId, // Creator is admin by default
          }))
        }
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
              },
            },
          },
        }
      }
    });

    // Trigger internal Webhook to inform participants
    const socketUrl = process.env.INTERNAL_SOCKET_URL?.replace('localhost', '127.0.0.1') || 'http://127.0.0.1:3002';
    if (socketUrl) {
      const userChannels = allParticipantIds.map(id => `private-vendor-${vendorId}-user-${id}`);
      fetch(`${socketUrl}/api/internal/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'new-room',
          channel: userChannels,
          data: newRoom,
          secret: process.env.SOCKET_SECRET,
        }),
      }).catch(err => console.error('Failed to trigger new-room webhook:', err));
    }

    return NextResponse.json(newRoom);

  } catch (error) {
    console.error('CHAT_ROOMS_POST_ERROR', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
