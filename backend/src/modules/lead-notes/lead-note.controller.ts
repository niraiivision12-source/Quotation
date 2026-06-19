import { Request, Response } from "express";
import { LeadNoteService } from "./lead-note.service";

export class LeadNoteController {
  static async addNote(req: Request, res: Response) {
    const { id } = req.params;
    const { note } = req.body;

    const userId = req.user?.id;

    const result = await LeadNoteService.addNote(id as string, note, userId);

    res.status(201).json({
      success: true,
      data: result,
    });
  }

  static async getNotes(req: Request, res: Response) {
    const { id } = req.params;

    const result = await LeadNoteService.getNotes(id as string);

    res.json({
      success: true,
      data: result,
    });
  }
}
