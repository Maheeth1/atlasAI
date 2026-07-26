import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
    PORT: z.coerce.number(),

    LOG_LEVEL: z.enum([
        "fatal",
        "error",
        "warn",
        "info",
        "debug",
        "trace",
        "silent",
    ]),

    DATABASE_PATH: z.string(),

    OPENAI_API_KEY: z.string().optional(),

    OLLAMA_URL: z.string(),

    INDEXER_THREADS: z.coerce.number(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
    console.error(parsed.error.format());
    process.exit(1);
}

export const env = parsed.data;