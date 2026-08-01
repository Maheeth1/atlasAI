import { env } from "../config/env";
import { v4 as uuidv4 } from "uuid";
import { systemLogger } from "../logger";
import type { TextChunk } from "../indexing/types";

/**
 * EmbeddingService abstracts generation of vector embeddings for a piece of text.
 * It supports the following providers, configured via `EMBEDDING_PROVIDER` in `.env`:
 *   - "ollama" – uses the local Ollama server (default model `OLLAMA_EMBEDDING_MODEL`).
 *   - "openai" – uses OpenAI's embedding endpoint (model `text-embedding-3-large`).
 *   - "auto" – picks the first available provider (prefers Ollama if reachable).
 */
export class EmbeddingService {
    /** Generate an embedding for the supplied text using the configured provider. */
    public static async generate(text: string): Promise<number[]> {
        const provider = env.EMBEDDING_PROVIDER;
        if (provider === "ollama") {
            return this.fromOllama(text);
        }
        if (provider === "openai") {
            return this.fromOpenAI(text);
        }
        // auto: try Ollama first, fall back to OpenAI if it fails
        try {
            return await this.fromOllama(text);
        } catch (err) {
            systemLogger.warn(err, "Ollama embedding failed, falling back to OpenAI");
            return this.fromOpenAI(text);
        }
    }

    private static async fromOllama(text: string): Promise<number[]> {
        const response = await fetch(env.OLLAMA_URL + "/api/embeddings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: env.OLLAMA_EMBEDDING_MODEL, prompt: text }),
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Ollama embedding error: ${response.status} ${errText}`);
        }
        const data = (await response.json()) as { embeddings: number[] };
        return data.embeddings;
    }

    private static async fromOpenAI(text: string): Promise<number[]> {
        const { OpenAI } = await import("openai");
        const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
        const resp = await client.embeddings.create({
            model: "text-embedding-3-large",
            input: text,
        });
        return resp.data[0].embedding;
    }

    /**
     * Convert raw `TextChunk` objects into `IndexedChunk` objects with embeddings.
     * The returned chunks contain a unique `id`, the original `embeddingId`,
     * and the generated `embedding` vector.
     */
    public static async embedChunks(chunks: TextChunk[]): Promise<IndexedChunk[]> {
        const indexed: IndexedChunk[] = [];
        for (const chunk of chunks) {
            const embedding = await this.generate(chunk.content);
            const embeddingId = uuidv4();
            indexed.push({
                ...chunk,
                id: uuidv4(),
                embeddingId,
                embedding,
            });
        }
        return indexed;
    }
}

// Types used by the service – they mirror the types defined in the app
interface IndexedChunk extends TextChunk {
    id: string;
    embeddingId: string;
    embedding: number[];
}
