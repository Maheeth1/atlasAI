import { ChromaClient } from "chromadb";
import { env } from "../config/env";
import { databaseLogger } from "../logger";

export class ChromaManager {
    private static instance: ChromaManager;
    private client: ChromaClient | null = null;
    private collection: any = null;

    private constructor() {}

    static getInstance() {
        if (!ChromaManager.instance) {
            ChromaManager.instance = new ChromaManager();
        }
        return ChromaManager.instance;
    }

    public async initialize() {
        if (env.CHROMA_ENABLED !== true && String(env.CHROMA_ENABLED) !== "true") {
            databaseLogger.info("ChromaDB is disabled via config.");
            return;
        }

        databaseLogger.info(`Connecting to ChromaDB at ${env.CHROMA_URL}...`);

        try {
            this.client = new ChromaClient({
                path: env.CHROMA_URL,
            });

            // Heartbeat check
            await this.client.heartbeat();
            
            this.collection = await this.client.getOrCreateCollection({
                name: env.CHROMA_COLLECTION,
            });

            databaseLogger.info(`ChromaDB initialized. Collection: ${env.CHROMA_COLLECTION}`);
        } catch (error) {
            databaseLogger.error(error, "Failed to initialize ChromaDB");
            throw error;
        }
    }

    public getClient() {
        return this.client;
    }

    public getCollection() {
        return this.collection;
    }
}

export const chromaDB = ChromaManager.getInstance();
