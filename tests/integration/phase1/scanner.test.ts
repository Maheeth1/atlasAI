import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { FileScanner } from '../../../apps/backend/src/indexing/scanner';
import { fileWatcher } from '../../../apps/backend/src/indexing/watcher';
import { documentRepository } from '../../../apps/backend/src/repositories/documentRepository';
import { DatabaseManager } from '../../../apps/backend/src/database/database';

describe('Phase 1: Local File Scanner', () => {
    let testFolder: string;
    let db: DatabaseManager;

    beforeAll(async () => {
        db = (DatabaseManager as any).getInstance();
        
        // Create a temporary TestFolder
        testFolder = path.join(os.tmpdir(), 'atlasai_test_folder_' + Date.now());
        await fs.mkdir(testFolder, { recursive: true });

        // Create 5 valid files
        await fs.writeFile(path.join(testFolder, 'resume.pdf'), 'fake content');
        await fs.writeFile(path.join(testFolder, 'notes.docx'), 'fake content');
        await fs.writeFile(path.join(testFolder, 'image.png'), 'fake content');
        await fs.writeFile(path.join(testFolder, 'song.mp3'), 'fake content');
        await fs.writeFile(path.join(testFolder, 'movie.mp4'), 'fake content');

        // Create a hidden folder with a file (should be ignored)
        const hiddenFolder = path.join(testFolder, '.secret');
        await fs.mkdir(hiddenFolder);
        await fs.writeFile(path.join(hiddenFolder, 'hidden.txt'), 'secret content');
    });

    afterAll(async () => {
        fileWatcher.stop();
        if (db) {
            db.close();
        }
        await fs.rm(testFolder, { recursive: true, force: true });
    });

    it('Scanner finds exactly 5 files', async () => {
        const scannedFiles = [];
        for await (const file of FileScanner.scanDirectory(testFolder)) {
            scannedFiles.push(file);
        }

        expect(scannedFiles.length).toBe(5);
        const filenames = scannedFiles.map(f => f.filename);
        expect(filenames).toContain('resume.pdf');
        expect(filenames).toContain('notes.docx');
        expect(filenames).toContain('image.png');
        expect(filenames).toContain('song.mp3');
        expect(filenames).toContain('movie.mp4');
        expect(filenames).not.toContain('hidden.txt');
    });

    it('Watcher detects additions, deletions, and updates database automatically', async () => {
        // Start watcher
        fileWatcher.start([testFolder]);

        // Wait a tiny bit for chokidar to initialize and fire initial events (though ignoreInitial is true)
        await new Promise(resolve => setTimeout(resolve, 500));

        // Create a new file manually to trigger "add" event
        const newFilePath = path.join(testFolder, 'new_test.txt');
        await fs.writeFile(newFilePath, 'hello world');
        
        // Wait for chokidar to detect and DB to process
        await new Promise(resolve => setTimeout(resolve, 500));

        let doc = documentRepository.getByPath(newFilePath);
        expect(doc).toBeDefined();
        expect(doc?.filename).toBe('new_test.txt');

        // Delete the file
        await fs.unlink(newFilePath);

        // Wait for chokidar to detect unlink
        await new Promise(resolve => setTimeout(resolve, 500));

        doc = documentRepository.getByPath(newFilePath);
        expect(doc).toBeUndefined(); // Should be removed from DB
    });

    it('Rename updates database automatically', async () => {
        const oldPath = path.join(testFolder, 'resume.pdf');
        const newPath = path.join(testFolder, 'resume_v2.pdf');

        // First, add resume.pdf to DB manually to simulate it was already indexed
        documentRepository.upsertMetadata({
            path: oldPath,
            filename: 'resume.pdf',
            extension: '.pdf',
            size: 10,
            modifiedAt: new Date().toISOString()
        }, '', 'pending');

        expect(documentRepository.getByPath(oldPath)).toBeDefined();

        // Rename it
        await fs.rename(oldPath, newPath);

        // Wait for watcher
        await new Promise(resolve => setTimeout(resolve, 500));

        // Old path should be deleted, new path added
        expect(documentRepository.getByPath(oldPath)).toBeUndefined();
        
        const updatedDoc = documentRepository.getByPath(newPath);
        expect(updatedDoc).toBeDefined();
        expect(updatedDoc?.filename).toBe('resume_v2.pdf');
    });
});
