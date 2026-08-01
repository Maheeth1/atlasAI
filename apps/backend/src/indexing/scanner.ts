import fs from "node:fs/promises";
import path from "node:path";
import { supportedExtensions, ScannedFile } from "./types";
import { systemLogger } from "../logger";

const IGNORED_FOLDERS = new Set([
    "node_modules",
    ".git",
    "System Volume Information",
    "$RECYCLE.BIN",
    "AppData",
    "Program Files",
    "Program Files (x86)",
    "Windows",
]);

export class FileScanner {
    
    public static async *scanDirectory(dirPath: string): AsyncGenerator<ScannedFile, void, unknown> {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);

                if (entry.isDirectory()) {
                    // Ignore hidden folders
                    if (entry.name.startsWith(".")) {
                        continue;
                    }
                    
                    // Ignore specific system folders
                    if (IGNORED_FOLDERS.has(entry.name)) {
                        continue;
                    }

                    // Recursive call
                    yield* this.scanDirectory(fullPath);
                } else if (entry.isFile()) {
                    // Ignore hidden files
                    if (entry.name.startsWith(".")) {
                        continue;
                    }

                    const ext = path.extname(entry.name).toLowerCase();

                    try {
                        const stats = await fs.stat(fullPath);
                        yield {
                            path: fullPath,
                            filename: entry.name,
                            extension: ext,
                            size: stats.size,
                            modifiedAt: stats.mtime.toISOString(),
                        };
                    } catch (error) {
                        systemLogger.warn(error, `Failed to get stats for file: ${fullPath}`);
                    }
                }
            }
        } catch (error) {
            systemLogger.warn(error, `Failed to read directory: ${dirPath}`);
        }
    }
}
