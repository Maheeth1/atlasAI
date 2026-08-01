import { describe, it, expect } from 'vitest';
import { TextChunker } from '../../../apps/backend/src/indexing/chunker';

describe('Phase 3: Text Chunking', () => {
    
    // Generate a ~5000 word document
    const generateDocument = (wordCount: number) => {
        const words = ['apple', 'banana', 'cherry', 'date', 'elderberry', 'fig', 'grape'];
        let doc = "";
        for (let i = 0; i < wordCount; i++) {
            doc += words[i % words.length] + " ";
        }
        return doc.trim();
    };

    it('chunks a 5000-word document correctly', () => {
        const text = generateDocument(5000);
        
        const chunks = TextChunker.chunkText(text, 1000, 200);

        // Verify chunk count > 0
        expect(chunks.length).toBeGreaterThan(0);

        // Verify no missing text by ensuring the concatenated text covers everything
        // Note: because chunks overlap, we need to stitch them carefully or just ensure
        // start of chunk 0 is 0, end of last chunk is text.length, and start of chunk i <= end of chunk i-1
        
        expect(chunks[0].charStart).toBe(0);
        expect(chunks[chunks.length - 1].charEnd).toBe(text.length);

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            
            // Verify chunk content matches original text exactly at those indices
            expect(chunk.content).toBe(text.slice(chunk.charStart, chunk.charEnd));
            
            // Verify size constraint
            expect(chunk.content.length).toBeLessThanOrEqual(1000);

            if (i > 0) {
                const prevChunk = chunks[i - 1];
                
                // Verify NO gaps
                expect(chunk.charStart).toBeLessThanOrEqual(prevChunk.charEnd);
                
                // Verify overlap exists and is accurate
                const overlapText = text.slice(chunk.charStart, prevChunk.charEnd);
                expect(overlapText.length).toBeGreaterThan(0);
                
                expect(chunk.content.startsWith(overlapText)).toBe(true);
                expect(prevChunk.content.endsWith(overlapText)).toBe(true);
            }
        }
    });

    it('handles very long words without infinite loops', () => {
        // A single 2000 character string without spaces
        const longWord = 'a'.repeat(2000);
        
        const chunks = TextChunker.chunkText(longWord, 1000, 200);
        
        expect(chunks.length).toBe(3); 
        // Chunk 1: 0 to 1000
        // Chunk 2: 800 to 1800 (overlap 200)
        // Chunk 3: 1600 to 2000
        
        expect(chunks[0].charEnd).toBe(1000);
        expect(chunks[1].charStart).toBe(800);
        expect(chunks[1].charEnd).toBe(1800);
        expect(chunks[2].charStart).toBe(1600);
        expect(chunks[2].charEnd).toBe(2000);
    });
});
