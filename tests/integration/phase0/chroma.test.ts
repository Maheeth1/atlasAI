import { describe, it, expect, beforeAll } from 'vitest';
import { ChromaManager } from '../../../apps/backend/src/database/chroma';

describe('Phase 0: ChromaDB', () => {
    let chroma: ChromaManager;

    beforeAll(async () => {
        chroma = (ChromaManager as any).getInstance();
        // we might not want to re-initialize if the server is running,
        // but for integration tests we can try.
        try {
            await chroma.initialize();
        } catch (error) {
            console.error("Failed to initialize ChromaDB for tests. Is it running?", error);
        }
    });

    it('should connect to ChromaDB and get/create the collection', () => {
        expect(chroma).toBeDefined();
        const client = chroma.getClient();
        expect(client).toBeDefined();
        
        const collection = chroma.getCollection();
        expect(collection).toBeDefined();
        if (collection) {
            expect(collection.name).toBe('atlasai_chunks');
        }
    });
});
