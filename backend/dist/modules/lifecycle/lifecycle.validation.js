"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePhaseSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
exports.updatePhaseSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.LifecycleStatus),
    remarks: zod_1.z.string().optional(),
});
//# sourceMappingURL=lifecycle.validation.js.map