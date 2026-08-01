import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
    PORT: z.coerce.number().int().min(1).max(65535).default(5000),

    LOG_LEVEL: z.enum([
        "fatal",
        "error",
        "warn",
        "info",
        "debug",
        "trace",
        "silent",
    ]).default("info"),

    DATABASE_PATH: z.string().trim().min(1).default("./atlas.db"),

    OPENAI_API_KEY: z.string().optional(),

    OLLAMA_URL: z.url().default("http://127.0.0.1:11434"),

    OLLAMA_EMBEDDING_MODEL: z.string().trim().min(1).default("nomic-embed-text"),

    OLLAMA_CHAT_MODEL: z.string().trim().min(1).default("llama3.2"),

    EMBEDDING_PROVIDER: z.enum(["auto", "local", "ollama", "openai"]).default("auto"),

    CHROMA_URL: z.url().default("http://127.0.0.1:8000"),

    CHROMA_COLLECTION: z.string().trim().min(1).default("atlasai_chunks"),

    CHROMA_ENABLED: z.stringbool().default(true),

    MCP_ALLOWED_ROOTS: z.string().default(""),

    MCP_TOOL_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(120_000).default(30_000),

    INDEXER_THREADS: z.coerce.number().int().min(1).max(64).default(2),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
    console.error(parsed.error.format());
    process.exit(1);
}

export const env = parsed.data;
