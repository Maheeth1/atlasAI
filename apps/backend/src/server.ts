import app from "./app";
import { env } from "./config/env";
import { backendLogger } from "./logger";
import { database } from "./database/database";

import "./services/AppEvents";
import { samplePlugin } from "./plugins/samplePlugin";
import { pluginLoader } from "./plugins/PluginLoader";

let isShuttingDown = false;

async function start() {
    await pluginLoader.load(samplePlugin);

    const server = app.listen(env.PORT, () => {
        backendLogger.info(
            `Backend running at http://localhost:${env.PORT}`
        );
    });

    async function shutdown() {
        if (isShuttingDown) return;

        isShuttingDown = true;
        backendLogger.warn("Gracefully shutting down...");

        server.close(async () => {
            await Promise.all(
                pluginLoader.getPlugins().map((plugin) => pluginLoader.unload(plugin.name))
            );
            database.close();

            backendLogger.info("Backend stopped.");
            process.exit(0);
        });
    }

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}

start().catch((error: unknown) => {
    backendLogger.fatal(error, "Backend failed to start.");
    database.close();
    process.exit(1);
});
