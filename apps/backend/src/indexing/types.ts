export const supportedExtensions = new Set([
    ".pdf",
    ".docx",
    ".txt",
    ".md",
    ".markdown",
    ".html",
    ".htm",
]);

export type DocumentStatus = "pending" | "indexed" | "skipped" | "error";

export interface ScannedFile {
    path: string;
    filename: string;
    extension: string;
    size: number;
    modifiedAt: string;
}

export interface TextChunk {
    content: string;
    index: number;
    charStart: number;
    charEnd: number;
}

export interface IndexedChunk extends TextChunk {
    id: string;
    embeddingId: string;
    embedding: number[];
}

export interface IndexedDocument extends ScannedFile {
    id: string;
    hash: string;
    status: DocumentStatus;
    error: string | null;
    indexedAt: string | null;
}

export interface IndexSummary {
    root: string;
    discovered: number;
    indexed: number;
    skipped: number;
    failed: number;
    deleted: number;
    durationMs: number;
}

export interface SearchResult {
    chunkId: string;
    documentId: string;
    filename: string;
    path: string;
    content: string;
    score: number;
    chunkIndex: number;
}

export interface VectorRecord {
    id: string;
    documentId: string;
    path: string;
    filename: string;
    chunkIndex: number;
    content: string;
    embedding: number[];
}
