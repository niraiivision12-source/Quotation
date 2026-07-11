import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string(),

  DATABASE_URL: z.string().min(1),

  JWT_SECRET: z.string().min(10),

  SYNC_API_KEY: z.string().min(1),
});

const parsed = envSchema.parse(process.env);

export const env = {
  PORT: Number(parsed.PORT),

  DATABASE_URL: parsed.DATABASE_URL,

  JWT_SECRET: parsed.JWT_SECRET,

  SYNC_API_KEY: parsed.SYNC_API_KEY,
};
