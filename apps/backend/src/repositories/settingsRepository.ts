import { database } from "../database/database";

export class SettingsRepository {
    private db = database.connection();

    getAll() {
        return this.db
            .prepare("SELECT * FROM settings")
            .all();
    }

    get(key: string) {
        return this.db
            .prepare("SELECT * FROM settings WHERE key=?")
            .get(key);
    }

    set(key: string, value: string) {
        this.db
            .prepare(`
        INSERT INTO settings(key,value)
        VALUES (?,?)
        ON CONFLICT(key)
        DO UPDATE SET
            value=excluded.value,
            updated_at=CURRENT_TIMESTAMP
      `)
            .run(key, value);
    }
}

export const settingsRepository = new SettingsRepository();