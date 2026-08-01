import express from "express";
import cors from "cors";
import healthRoute from "./api/health";
import settingsRoute from "./api/settings";
import databaseRoute from "./api/database";
import pluginsRoute from "./api/plugins";
import systemRoute from "./api/system";

const app = express();

app.use(cors());

app.use(express.json({ limit: "1mb" }));

const apiRouter = express.Router();

apiRouter.use("/health", healthRoute);

apiRouter.use("/settings", settingsRoute);

apiRouter.use("/database", databaseRoute);

apiRouter.use("/plugins", pluginsRoute);

apiRouter.use("/system", systemRoute);

// Keep the original endpoints available while exposing a stable /api namespace
// for browser and desktop clients.
app.use("/api", apiRouter);
app.use(apiRouter);

app.use((_, res) => {
    res.status(404).json({
        success: false,
        error: "Route not found",
    });
});

app.use((error: unknown, _: express.Request, res: express.Response, __: express.NextFunction) => {
    console.error(error);
    res.status(500).json({
        success: false,
        error: "Unexpected server error",
    });
});

export default app;
