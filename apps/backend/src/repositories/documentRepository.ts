import crypto from "node:crypto";
import path from "node:path";
import Database from "better-sqlite3";
import { database } from "../database/database";
import type {
    DocumentStatus,
    IndexedChunk,
    IndexedDocument,
    ScannedFile,
    SearchResult,
} from "../indexing/types";

interface DocumentRow {
    id: string;
    filename: string;
    path: string;
    extension: string;
    size: number;
    modified_at: string;
    hash: string;
    status: DocumentStatus;
    error: string | null;
    indexed_at: string | null;
}

interface SearchRow {
    document_id: string;
    filename: string;
    path: string;
    extension: string;
    size: number;
    modified_at: string;
    hash: string;
    status: DocumentStatus;
    error: string | null;
    indexed_at: string | null;
    chunk_id: string;
    chunk_index: number;
    content: string;
    embedding_json: string;
    rank?: number;
}

function toDocument(row: DocumentRow): IndexedDocument {
    return {
        id: row.id,
        filename: row.filename,
        path: row.path,
        extension: row.extension,
        size: row.size,
        modifiedAt: row.modified_at,
        hash: row.hash,
        status: row.status,
        error: row.error,
        indexedAt: row.indexed_at,
    };
}

export class DocumentRepository {
    constructor(private readonly db: Database.Database = database.connection()) {}

    getByPath(filePath: string): IndexedDocument | undefined {
        const row = this.db
            .prepare("SELECT * FROM documents WHERE path = ?")
            .get(filePath) as DocumentRow | undefined;
        return row ? toDocument(row) : undefined;
    }

    isCurrent(filePath: string, hash: string): boolean {
        const row = this.db
            .prepare("SELECT hash, status FROM documents WHERE path = ?")
            .get(filePath) as { hash: string; status: DocumentStatus } | undefined;
        return row?.hash === hash && row.status === "indexed";
    }

    upsertMetadata(file: ScannedFile, hash: string, status: DocumentStatus = "pending"): IndexedDocument {
        const current = this.getByPath(file.path);
        const id = current?.id ?? crypto.randomUUID();

        this.db
            .prepare(`
                INSERT INTO documents(id, filename, path, extension, size, modified_at, hash, status, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(path) DO UPDATE SET
                    filename = excluded.filename,
                    extension = excluded.extension,
                    size = excluded.size,
                    modified_at = excluded.modified_at,
                    hash = excluded.hash,
                    status = excluded.status,
                    error = NULL,
                    updated_at = CURRENT_TIMESTAMP
            `)
            .run(id, file.filename, file.path, file.extension, file.size, file.modifiedAt, hash, status);

        return this.getByPath(file.path)!;
    }

    saveIndexedDocument(file: ScannedFile, hash: string, chunks: IndexedChunk[]): IndexedDocument {
        const write = this.db.transaction(() => {
            const document = this.upsertMetadata(file, hash, "indexed");
            const oldChunks = this.db
                .prepare("SELECT id FROM document_chunks WHERE document_id = ?")
                .all(document.id) as Array<{ id: string }>;

            if (oldChunks.length > 0) {
                const deleteFts = this.db.prepare("DELETE FROM document_chunks_fts WHERE chunk_id = ?");
                for (const chunk of oldChunks) deleteFts.run(chunk.id);
            }

            this.db.prepare("DELETE FROM document_chunks WHERE document_id = ?").run(document.id);

            const insertChunk = this.db.prepare(`
                INSERT INTO document_chunks(
                    id, document_id, chunk_index, content, char_start, char_end, embedding_id, embedding_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            const insertFts = this.db.prepare(`
                INSERT INTO document_chunks_fts(content, chunk_id, document_id) VALUES (?, ?, ?)
            `);

            for (const chunk of chunks) {
                insertChunk.run(
                    chunk.id,
                    document.id,
                    chunk.index,
                    chunk.content,
                    chunk.charStart,
                    chunk.charEnd,
                    chunk.embeddingId,
                    JSON.stringify(chunk.embedding),
                );
                insertFts.run(chunk.content, chunk.id, document.id);
            }

            this.db
                .prepare(`
                    UPDATE documents
                    SET status = 'indexed', error = NULL, indexed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `)
                .run(document.id);
        });

        write();
        return this.getByPath(file.path)!;
    }

    markError(file: ScannedFile, hash: string, error: string): void {
        this.upsertMetadata(file, hash, "error");
        this.db
            .prepare("UPDATE documents SET error = ?, updated_at = CURRENT_TIMESTAMP WHERE path = ?")
            .run(error.slice(0, 2_000), file.path);
    }

    markSkipped(file: ScannedFile, hash: string): void {
        this.upsertMetadata(file, hash, "skipped");
    }

    deleteByPath(filePath: string): string[] {
        const document = this.getByPath(filePath);
        if (!document) return [];

        const chunks = this.db
            .prepare("SELECT id FROM document_chunks WHERE document_id = ?")
            .all(document.id) as Array<{ id: string }>;
        const remove = this.db.transaction(() => {
            const deleteFts = this.db.prepare("DELETE FROM document_chunks_fts WHERE chunk_id = ?");
            for (const chunk of chunks) deleteFts.run(chunk.id);
            this.db.prepare("DELETE FROM documents WHERE id = ?").run(document.id);
        });
        remove();
        return chunks.map((chunk) => chunk.id);
    }

    getIndexedPathsUnder(root: string): string[] {
        const normalizedRoot = path.resolve(root);
        const rows = this.db
            .prepare("SELECT path FROM documents")
            .all() as Array<{ path: string }>;
        return rows
            .map((row) => row.path)
            .filter((filePath) => {
                const relativePath = path.relative(normalizedRoot, filePath);
                return relativePath && !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
            });
    }

    getChunksByIds(ids: string[]): SearchResult[] {
        if (ids.length === 0) return [];
        const placeholders = ids.map(() => "?").join(",");
        const rows = this.db
            .prepare(`
                SELECT
                    d.id AS document_id, d.filename, d.path,
                    c.id AS chunk_id, c.chunk_index, c.content, c.embedding_json
                FROM document_chunks c
                JOIN documents d ON d.id = c.document_id
                WHERE c.id IN (${placeholders}) AND d.status = 'indexed'
            `)
            .all(...ids) as Array<{
            document_id: string;
            filename: string;
            path: string;
            chunk_id: string;
            chunk_index: number;
            content: string;
            embedding_json: string;
        }>;

        const byId = new Map(rows.map((row) => [row.chunk_id, row]));
        return ids.flatMap((id) => {
            const row = byId.get(id);
            return row
                ? [{
                    chunkId: row.chunk_id,
                    documentId: row.document_id,
                    filename: row.filename,
                    path: row.path,
                    content: row.content,
                    score: 0,
                    chunkIndex: row.chunk_index,
                }]
                : [];
        });
    }

    vectorCandidates(): Array<SearchResult & { embedding: number[] }> {
        const rows = this.db
            .prepare(`
                SELECT
                    d.id AS document_id, d.filename, d.path,
                    c.id AS chunk_id, c.chunk_index, c.content, c.embedding_json
                FROM document_chunks c
                JOIN documents d ON d.id = c.document_id
                WHERE d.status = 'indexed'
            `)
            .all() as SearchRow[];

        return rows.map((row) => ({
            chunkId: row.chunk_id,
            documentId: row.document_id,
            filename: row.filename,
            path: row.path,
            content: row.content,
            score: 0,
            chunkIndex: row.chunk_index,
            embedding: JSON.parse(row.embedding_json) as number[],
        }));
    }

    lexicalSearch(query: string, limit: number): SearchResult[] {
        const terms = query
            .toLocaleLowerCase()
            .match(/[\p{L}\p{N}_-]{2,}/gu)
            ?.slice(0, 12) ?? [];
        if (terms.length === 0) return [];

        const rows = this.db
            .prepare(`
                SELECT
                    d.id AS document_id, d.filename, d.path,
                    c.id AS chunk_id, c.chunk_index, c.content, c.embedding_json,
                    bm25(document_chunks_fts) AS rank
                FROM document_chunks_fts
                JOIN document_chunks c ON c.id = document_chunks_fts.chunk_id
                JOIN documents d ON d.id = c.document_id
                WHERE document_chunks_fts MATCH ? AND d.status = 'indexed'
                ORDER BY rank
                LIMIT ?
            `)
            .all(terms.map((term) => `"${term.replaceAll('"', "")}"`).join(" OR "), limit) as SearchRow[];

        return rows.map((row) => ({
            chunkId: row.chunk_id,
            documentId: row.document_id,
            filename: row.filename,
            path: row.path,
            content: row.content,
            score: 1 / (1 + Math.abs(row.rank ?? 0)),
            chunkIndex: row.chunk_index,
        }));
    }

    recent(limit = 20): IndexedDocument[] {
        const rows = this.db
            .prepare("SELECT * FROM documents ORDER BY updated_at DESC LIMIT ?")
            .all(limit) as DocumentRow[];
        return rows.map(toDocument);
    }

    stats(): { documents: number; chunks: number; errors: number } {
        const counts = this.db
            .prepare(`
                SELECT
                    COUNT(*) AS documents,
                    SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) AS errors
                FROM documents
            `)
            .get() as { documents: number; errors: number | null };
        const chunks = this.db.prepare("SELECT COUNT(*) AS count FROM document_chunks").get() as { count: number };
        return { documents: counts.documents, chunks: chunks.count, errors: counts.errors ?? 0 };
    }
}

export const documentRepository = new DocumentRepository();
