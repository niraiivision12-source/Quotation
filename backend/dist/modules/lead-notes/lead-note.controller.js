"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadNoteController = void 0;
const lead_note_service_1 = require("./lead-note.service");
class LeadNoteController {
    static async addNote(req, res) {
        const { id } = req.params;
        const { note } = req.body;
        const userId = req.user?.id;
        const result = await lead_note_service_1.LeadNoteService.addNote(id, note, userId);
        res.status(201).json({
            success: true,
            data: result,
        });
    }
    static async getNotes(req, res) {
        const { id } = req.params;
        const result = await lead_note_service_1.LeadNoteService.getNotes(id);
        res.json({
            success: true,
            data: result,
        });
    }
}
exports.LeadNoteController = LeadNoteController;
//# sourceMappingURL=lead-note.controller.js.map