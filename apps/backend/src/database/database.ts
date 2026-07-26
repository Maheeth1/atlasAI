import Database from "better-sqlite3";
import { env } from "../config/env";
import { databaseLogger } from "../logger";
import { schema } from "./schema";

export class DatabaseManager {
    private static instance: DatabaseManager;

    private db: Database.Database;

    private constructor() {
        this.db = new Database(env.DATABASE_PATH);

        this.initialize();
    }

    static getInstance() {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }

        return DatabaseManager.instance;
    }

    private initialize() {
        databaseLogger.info("Opening SQLite database...");

        this.db.exec(schema);

        databaseLogger.info("Database initialized.");
    }

    public connection() {
        return this.db;
    }

    public close() {
        this.db.close();

        databaseLogger.info("Database closed.");
    }
}

export const database = DatabaseManager.getInstance();