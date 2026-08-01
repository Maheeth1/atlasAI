import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { TextExtractor } from '../../../apps/backend/src/indexing/extractor';

// Mock the heavy PDF and DOCX parsing libraries for reliable integration testing
vi.mock('pdf-parse', () => {
    return {
        default: vi.fn(async (buffer: Buffer) => {
            const content = buffer.toString('utf-8');
            if (content === 'corrupt') {
                throw new Error("Invalid PDF structure");
            }
            return { text: "mocked pdf text" };
        })
    };
});

vi.mock('mammoth', () => {
    return {
        default: {
            extractRawText: vi.fn(async () => {
                return { value: "mocked docx text" };
            })
        }
    };
});

describe('Phase 2: Text Extraction', () => {
    let testFolder: string;

    beforeEach(async () => {
        testFolder = path.join(os.tmpdir(), 'atlasai_phase2_' + Date.now());
        await fs.mkdir(testFolder, { recursive: true });
    });
    
    afterEach(async () => {
        await fs.rm(testFolder, { recursive: true, force: true });
    });

    it('extracts text from 10 TXT files', async () => {
        for (let i = 0; i < 10; i++) {
            const filePath = path.join(testFolder, `file_${i}.txt`);
            await fs.writeFile(filePath, `hello txt ${i}`);
            
            const text = await TextExtractor.extractText(filePath, '.txt');
            expect(text).toBe(`hello txt ${i}`);
        }
    });

    it('extracts text from HTML file stripping tags', async () => {
        const filePath = path.join(testFolder, 'index.html');
        await fs.writeFile(filePath, '<html><head><style>body { color: red; }</style><script>alert("test");</script></head><body><h1>Hello</h1><p>World</p></body></html>');
        
        const text = await TextExtractor.extractText(filePath, '.html');
        expect(text).toContain('Hello World');
        expect(text).not.toContain('alert');
        expect(text).not.toContain('color');
    });

    it('extracts text from 10 DOCX files', async () => {
        for (let i = 0; i < 10; i++) {
            const filePath = path.join(testFolder, `doc_${i}.docx`);
            await fs.writeFile(filePath, 'dummy content'); 
            
            const text = await TextExtractor.extractText(filePath, '.docx');
            expect(text).toBe('mocked docx text');
        }
    });

    it('extracts text from 10 PDF files', async () => {
        for (let i = 0; i < 10; i++) {
            const filePath = path.join(testFolder, `doc_${i}.pdf`);
            await fs.writeFile(filePath, 'dummy content'); 
            
            const text = await TextExtractor.extractText(filePath, '.pdf');
            expect(text).toBe('mocked pdf text');
        }
    });

    it('handles corrupted PDF gracefully by logging error and continuing', async () => {
        const filePath = path.join(testFolder, 'corrupt.pdf');
        await fs.writeFile(filePath, 'corrupt'); 
        
        // Should not throw, should return empty string
        const text = await TextExtractor.extractText(filePath, '.pdf');
        expect(text).toBe('');
    });
});
