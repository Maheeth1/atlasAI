import app from "./app";
import { env } from "./config/env";
import { backendLogger } from "./logger";
import { database } from "./database/database";

const server = app.listen(env.PORT, () => {
    backendLogger.info(
        `Backend running at http://localhost:${env.PORT}`
    );
});

function shutdown() {
    backendLogger.warn("Gracefully shutting down...");

    server.close(() => {
        database.close();

        backendLogger.info("Backend stopped.");

        process.exit(0);
    });
}

process.on("SIGINT", shutdown);

process.on("SIGTERM", shutdown);