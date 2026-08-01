import chokidar from "chokidar";
import path from "node:path";
import fs from "node:fs/promises";
import { supportedExtensions, ScannedFile } from "./types";
import { systemLogger } from "../logger";
import { documentRepository } from "../repositories/documentRepository";
import { TextExtractor } from "./extractor";

export class FileWatcher {
    private watcher: chokidar.FSWatcher | null = null;
    
    constructor() {}

    public start(roots: string[]) {
        if (this.watcher) {
            this.stop();
        }
        
        systemLogger.info(`Starting file watcher on roots: ${roots.join(", ")}`);
        
        this.watcher = chokidar.watch(roots, {
            ignored: (targetPath: string) => {
                const basename = path.basename(targetPath);
                
                // Ignore hidden files/folders
                if (basename.startsWith(".")) return true;
                
                // Ignore common system folders
                const ignoredDirs = new Set([
                    "node_modules",
                    ".git",
                    "System Volume Information",
                    "$RECYCLE.BIN",
                    "AppData",
                    "Windows"
                ]);
                
                if (ignoredDirs.has(basename)) return true;
                
                return false;
            },
            persistent: true,
            ignoreInitial: true, // Typically, a full scan is done first
        });

        this.watcher.on("add", this.handleAddChange.bind(this));
        this.watcher.on("change", this.handleAddChange.bind(this));
        this.watcher.on("unlink", this.handleUnlink.bind(this));
        
        this.watcher.on("error", (error) => {
            systemLogger.error(error, "FileWatcher error");
        });
    }

    public stop() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
            systemLogger.info("File watcher stopped");
        }
    }

    private async handleAddChange(filePath: string) {
        const ext = path.extname(filePath).toLowerCase();

        try {
            const stats = await fs.stat(filePath);
            const scannedFile: ScannedFile = {
                path: filePath,
                filename: path.basename(filePath),
                extension: ext,
                size: stats.size,
                modifiedAt: stats.mtime.toISOString(),
            };
            
            await TextExtractor.processFile(filePath);
            systemLogger.debug(`Processed file via TextExtractor: ${filePath}`);
        } catch (error) {
            systemLogger.warn(error, `Failed to process watcher event for: ${filePath}`);
        }
    }

    private handleUnlink(filePath: string) {
        const ext = path.extname(filePath).toLowerCase();
        
        try {
            documentRepository.deleteByPath(filePath);
            systemLogger.debug(`File watcher deleted: ${filePath}`);
        } catch (error) {
            systemLogger.warn(error, `Failed to delete from DB on unlink: ${filePath}`);
        }
    }
}

export const fileWatcher = new FileWatcher();
