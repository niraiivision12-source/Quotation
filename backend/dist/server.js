"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const prisma_1 = require("./config/prisma");
async function bootstrap() {
    try {
        // Check PostgreSQL extensions
        const extensions = await prisma_1.prisma.$queryRaw `
      SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm', 'unaccent');
    `;
        const installed = extensions.map((e) => e.extname);
        const required = ['pg_trgm', 'unaccent'];
        const missing = required.filter(r => !installed.includes(r));
        if (missing.length > 0) {
            console.error("\n================================================================================");
            console.error("CRITICAL DATABASE ERROR: Missing required PostgreSQL extension(s):");
            for (const ext of missing) {
                let reason = "";
                if (ext === 'pg_trgm') {
                    reason = "Trigram similarity (pg_trgm) for typo tolerance and similarity search.";
                }
                else if (ext === 'unaccent') {
                    reason = "Accent stripping (unaccent) for query normalization.";
                }
                console.error(`- ${ext}: ${reason}`);
                console.error(`  Who should install it: Database Administrator / Superuser`);
                console.error(`  SQL Command: CREATE EXTENSION IF NOT EXISTS ${ext};`);
            }
            console.error("================================================================================\n");
            process.exit(1);
        }
        app_1.default.listen(env_1.env.PORT, () => {
            console.log(`Server running on port ${env_1.env.PORT}`);
        });
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=server.js.map