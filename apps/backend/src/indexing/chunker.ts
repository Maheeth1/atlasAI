import { TextChunk } from "./types";

export class TextChunker {
    /**
     * Splits text into overlapping chunks, respecting word boundaries.
     * Guaranteed to cover 100% of the input text without gaps.
     */
    public static chunkText(text: string, maxChunkSize = 1000, overlap = 200): TextChunk[] {
        if (!text || text.trim() === "") {
            return [];
        }

        const chunks: TextChunk[] = [];
        let currentIndex = 0;
        let chunkIndex = 0;

        while (currentIndex < text.length) {
            let end = currentIndex + maxChunkSize;
            
            if (end < text.length) {
                // Try to find a clean break (space or newline) before the max size
                const lastSpace = text.lastIndexOf(' ', end);
                const lastNewline = text.lastIndexOf('\n', end);
                const splitPoint = Math.max(lastSpace, lastNewline);

                // Ensure we don't regress or stay stuck if a single word is larger than maxChunkSize
                if (splitPoint > currentIndex) {
                    end = splitPoint + 1; // Include the space/newline in the chunk
                }
            } else {
                end = text.length;
            }

            const content = text.slice(currentIndex, end);
            
            chunks.push({
                content,
                index: chunkIndex++,
                charStart: currentIndex,
                charEnd: end,
            });

            if (end >= text.length) {
                break;
            }

            // Determine the start of the next chunk
            let nextStart = end - overlap;
            
            // Ensure forward progress
            if (nextStart <= currentIndex) {
                nextStart = currentIndex + 1;
            }

            // Snap the next start backwards to a word boundary to avoid starting mid-word
            if (nextStart > currentIndex) {
                const prevSpace = text.lastIndexOf(' ', nextStart);
                const prevNewline = text.lastIndexOf('\n', nextStart);
                const prevSplit = Math.max(prevSpace, prevNewline);
                
                // Only snap if it doesn't push us back to or before the current index
                if (prevSplit > currentIndex) {
                    nextStart = prevSplit + 1;
                }
            }
            
            currentIndex = nextStart;
        }

        return chunks;
    }
}
