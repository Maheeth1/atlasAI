import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DatabaseManager } from '../../../apps/backend/src/database/database';

describe('Phase 0: SQLite Database', () => {
    let db: DatabaseManager;

    beforeAll(() => {
        db = (DatabaseManager as any).getInstance();
    });

    afterAll(() => {
        if (db) {
            db.close();
        }
    });

    it('should connect to the database and initialize the schema', () => {
        expect(db).toBeDefined();
        const connection = db.connection();
        expect(connection).toBeDefined();
        expect(connection.open).toBe(true);

        // Verify some tables are created
        const tables = connection.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[];
        const tableNames = tables.map(t => t.name);
        
        expect(tableNames).toContain('documents');
        expect(tableNames).toContain('document_chunks');
    });
});
