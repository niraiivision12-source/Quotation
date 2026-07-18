import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";

async function bootstrap() {
  try {
    // Check PostgreSQL extensions
    const extensions: any = await prisma.$queryRaw`
      SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm', 'unaccent');
    `;
    const installed = extensions.map((e: any) => e.extname);
    const required = ['pg_trgm', 'unaccent'];
    const missing = required.filter(r => !installed.includes(r));

    if (missing.length > 0) {
      console.error("\n================================================================================");
      console.error("CRITICAL DATABASE ERROR: Missing required PostgreSQL extension(s):");
      for (const ext of missing) {
        let reason = "";
        if (ext === 'pg_trgm') {
          reason = "Trigram similarity (pg_trgm) for typo tolerance and similarity search.";
        } else if (ext === 'unaccent') {
          reason = "Accent stripping (unaccent) for query normalization.";
        }
        console.error(`- ${ext}: ${reason}`);
        console.error(`  Who should install it: Database Administrator / Superuser`);
        console.error(`  SQL Command: CREATE EXTENSION IF NOT EXISTS ${ext};`);
      }
      console.error("================================================================================\n");
      process.exit(1);
    }

    app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

bootstrap();
