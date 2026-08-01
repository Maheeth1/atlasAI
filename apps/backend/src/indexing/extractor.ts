import fs from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import { TextChunker } from "./chunker";
import { ScannedFile } from "./types";
import { documentRepository } from "../repositories/documentRepository";
import { systemLogger } from "../logger";
import { embedText } from "./embeddingService";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export class TextExtractor {
    public static async processFile(filePath: string): Promise<void> {
        const stats = await fs.stat(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const rawBuffer = await fs.readFile(filePath);
        const hash = crypto.createHash('sha256').update(rawBuffer).digest('hex');
        

        const scannedFile = {
            path: filePath,
            filename: path.basename(filePath),
            extension: ext,
            size: stats.size,
            modifiedAt: stats.mtime.toISOString(),
        };

        // Upsert metadata as pending first
        documentRepository.upsertMetadata(scannedFile, "", "pending");

        const text = await this.extractText(filePath, ext);
        if (!text) {
            documentRepository.markSkipped(scannedFile, hash);
            return;
        }

        const chunks = TextChunker.chunkText(text);
        const indexedChunks = [] as any[];
        for (const c of chunks) {
            const embedding = await embedText(c.content);
            indexedChunks.push({
                ...c,
                id: crypto.randomUUID(),
                embeddingId: crypto.randomUUID(),
                embedding,
            });
        }
        // Removed duplicate stats declaration; using earlier stats variable
        const scanned: ScannedFile = {
            path: filePath,
            filename: path.basename(filePath),
            extension: ext,
            size: stats.size,
            modifiedAt: stats.mtime.toISOString(),
        };
        documentRepository.saveIndexedDocument(scanned, hash, indexedChunks);
    }
        public static async extractText(filePath: string, extension: string): Promise<string> {
        const ext = extension.toLowerCase();
        try {
            if (ext === ".pdf") {
                return await this.extractPdf(filePath);
            } else if (ext === ".docx") {
                return await this.extractDocx(filePath);
            } else if (ext === ".txt" || ext === ".md" || ext === ".markdown") {
                return await this.extractPlainText(filePath);
            } else if (ext === ".html" || ext === ".htm") {
                return await this.extractHtml(filePath);
            }
            return "";
        } catch (error) {
            systemLogger.warn(error, `Failed to extract text from ${filePath}`);
            return "";
        }
    }


    private static async extractPdf(filePath: string): Promise<string> {
        try {
            const dataBuffer = await fs.readFile(filePath);
            const data = await (pdfParse as any)(dataBuffer);
            return data.text || "";
        } catch (error) {
            systemLogger.error(error, `Corrupted or unreadable PDF: ${filePath}`);
            return "";
        }
    }

    private static async extractDocx(filePath: string): Promise<string> {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value || "";
    }

    private static async extractPlainText(filePath: string): Promise<string> {
        const content = await fs.readFile(filePath, "utf-8");
        return content;
    }

    private static async extractHtml(filePath: string): Promise<string> {
        const content = await fs.readFile(filePath, "utf-8");
        // Lightweight HTML tag stripping
        const text = content
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove style tags and content
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags and content
            .replace(/<[^>]*>?/gm, ' ') // Replace all other HTML tags with a space
            .replace(/\s+/g, ' ') // Collapse multiple spaces
            .trim();
        return text;
    }
}
