import { z } from "zod";

export const addLeadNoteSchema = z.object({
  note: z.string().min(1),
});
