"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadNoteService = void 0;
const prisma_1 = require("../../config/prisma");
const app_error_1 = require("../../utils/app-error");
class LeadNoteService {
    static async addNote(leadId, note, userId) {
        const lead = await prisma_1.prisma.lead.findUnique({
            where: { id: leadId },
        });
        if (!lead) {
            throw new app_error_1.AppError("Lead not found", 404);
        }
        const leadNote = await prisma_1.prisma.leadNote.create({
            data: {
                leadId,
                userId,
                note,
            },
        });
        await prisma_1.prisma.leadActivity.create({
            data: {
                leadId,
                userId,
                type: "UPDATED",
                message: "Note added",
            },
        });
        return leadNote;
    }
    static async getNotes(leadId) {
        return prisma_1.prisma.leadNote.findMany({
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
exports.LeadNoteService = LeadNoteService;
//# sourceMappingURL=lead-note.service.js.map