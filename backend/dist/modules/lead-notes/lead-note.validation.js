"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addLeadNoteSchema = void 0;
const zod_1 = require("zod");
exports.addLeadNoteSchema = zod_1.z.object({
    note: zod_1.z.string().min(1),
});
//# sourceMappingURL=lead-note.validation.js.map