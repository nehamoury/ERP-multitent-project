import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        vendorId: session.user.vendorId,
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("GET Notifications Error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, markAllRead } = body;

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: {
          vendorId: session.user.vendorId,
          userId: session.user.id,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 });
    }

    const notification = await prisma.notification.update({
      where: {
        id,
        vendorId: session.user.vendorId,
        userId: session.user.id,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error("PATCH Notification Error:", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { title, message, type, userId } = body;

    let targetUserIds: string[] = [];

    if (userId) {
      targetUserIds = [userId];
    } else {
      // If no specific userId, send to Admins and HR
      const admins = await prisma.user.findMany({
        where: {
          vendorId: session.user.vendorId,
          role: { in: ["ADMIN", "HR"] }
        },
        select: { id: true }
      });
      targetUserIds = admins.map(a => a.id);
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json({ error: "No target users found" }, { status: 400 });
    }

    const notifications = await Promise.all(
      targetUserIds.map(id =>
        prisma.notification.create({
          data: {
            vendorId: session.user.vendorId,
            userId: id,
            title,
            message: `${session.user.name} - ${message}`,
            type: type || "info",
          }
        })
      )
    );

    return NextResponse.json({ success: true, count: notifications.length });
  } catch (error) {
    console.error("POST Notification Error:", error);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}
