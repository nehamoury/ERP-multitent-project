import { prisma } from './prisma';

/**
 * Synchronizes the membership of a Project Chat Room based on the current Project members.
 * Should be called whenever a project is updated.
 */
export async function syncProjectChatMembers(projectId: string, vendorId: string) {
  try {
    // Check if a Project chat room exists
    const room = await prisma.chatRoom.findFirst({
      where: { vendorId, type: 'PROJECT', projectId }
    });

    if (!room) return; // No room exists, nothing to sync

    // Fetch current project members
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true }
    });

    if (!project) return;

    // Expected members: Project Manager + all members
    const expectedMemberIds = new Set(project.members.map(m => m.id));
    expectedMemberIds.add(project.managerId);

    // Get current participants in the room
    const currentParticipants = await prisma.chatParticipant.findMany({
      where: { roomId: room.id }
    });
    
    const currentMemberIds = new Set(currentParticipants.map(p => p.userId));
    
    // Determine who needs to be added and who needs to be removed
    const toAdd = Array.from(expectedMemberIds).filter(id => !currentMemberIds.has(id));
    const toRemove = Array.from(currentMemberIds).filter(id => !expectedMemberIds.has(id));

    // Remove users
    if (toRemove.length > 0) {
      await prisma.chatParticipant.deleteMany({
        where: {
          roomId: room.id,
          userId: { in: toRemove }
        }
      });
      // Optionally trigger 'room-removed' socket event here if we had a dedicated event
    }

    // Add users
    if (toAdd.length > 0) {
      await prisma.chatParticipant.createMany({
        data: toAdd.map(userId => ({
          vendorId,
          userId,
          roomId: room.id,
          isAdmin: userId === project.managerId,
        }))
      });
      // Optionally trigger 'new-room' socket event here
    }

    console.log(`Synced Project Chat ${room.id}: Added ${toAdd.length}, Removed ${toRemove.length}`);
  } catch (error) {
    console.error('Failed to sync project chat members', error);
  }
}

/**
 * Synchronizes the membership of a Department Chat Room.
 * Should be called whenever an employee's department changes or a department is updated.
 */
export async function syncDepartmentChatMembers(departmentId: string, vendorId: string) {
  try {
    const room = await prisma.chatRoom.findFirst({
      where: { vendorId, type: 'DEPARTMENT', departmentId }
    });

    if (!room) return;

    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: { users: true }
    });

    if (!department) return;

    const expectedMemberIds = new Set(department.users.map(u => u.id));
    if (department.headId) expectedMemberIds.add(department.headId);

    const currentParticipants = await prisma.chatParticipant.findMany({
      where: { roomId: room.id }
    });
    
    const currentMemberIds = new Set(currentParticipants.map(p => p.userId));
    
    const toAdd = Array.from(expectedMemberIds).filter(id => !currentMemberIds.has(id));
    const toRemove = Array.from(currentMemberIds).filter(id => !expectedMemberIds.has(id));

    if (toRemove.length > 0) {
      await prisma.chatParticipant.deleteMany({
        where: {
          roomId: room.id,
          userId: { in: toRemove }
        }
      });
    }

    if (toAdd.length > 0) {
      await prisma.chatParticipant.createMany({
        data: toAdd.map(userId => ({
          vendorId,
          userId,
          roomId: room.id,
          isAdmin: userId === department.headId,
        }))
      });
    }

    console.log(`Synced Department Chat ${room.id}: Added ${toAdd.length}, Removed ${toRemove.length}`);
  } catch (error) {
    console.error('Failed to sync department chat members', error);
  }
}

/**
 * Synchronizes the membership of a Team Chat Room.
 * Should be called whenever an employee's team changes or a team is updated.
 */
export async function syncTeamChatMembers(teamId: string, vendorId: string) {
  try {
    const room = await prisma.chatRoom.findFirst({
      where: { vendorId, type: 'TEAM', teamId }
    });

    if (!room) return;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { users: true }
    });

    if (!team) return;

    const expectedMemberIds = new Set(team.users.map(u => u.id));
    if (team.leadId) expectedMemberIds.add(team.leadId);

    const currentParticipants = await prisma.chatParticipant.findMany({
      where: { roomId: room.id }
    });
    
    const currentMemberIds = new Set(currentParticipants.map(p => p.userId));
    
    const toAdd = Array.from(expectedMemberIds).filter(id => !currentMemberIds.has(id));
    const toRemove = Array.from(currentMemberIds).filter(id => !expectedMemberIds.has(id));

    if (toRemove.length > 0) {
      await prisma.chatParticipant.deleteMany({
        where: {
          roomId: room.id,
          userId: { in: toRemove }
        }
      });
    }

    if (toAdd.length > 0) {
      await prisma.chatParticipant.createMany({
        data: toAdd.map(userId => ({
          vendorId,
          userId,
          roomId: room.id,
          isAdmin: userId === team.leadId,
        }))
      });
    }

    console.log(`Synced Team Chat ${room.id}: Added ${toAdd.length}, Removed ${toRemove.length}`);
  } catch (error) {
    console.error('Failed to sync team chat members', error);
  }
}
