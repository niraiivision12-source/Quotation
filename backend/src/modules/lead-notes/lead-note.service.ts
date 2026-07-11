import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/app-error";

export class LeadNoteService {
  static async addNote(leadId: string, note: string, userId?: string) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new AppError("Lead not found", 404);
    }

    const leadNote = await prisma.leadNote.create({
      data: {
        leadId,
        userId,
        note,
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId,
        userId,
        type: "UPDATED",
        message: "Note added",
      },
    });

    return leadNote;
  }

  static async getNotes(leadId: string) {
    return prisma.leadNote.findMany({
      where: { leadId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}
