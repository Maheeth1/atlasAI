import express from "express";
import cors from "cors";
import healthRoute from "./api/health";
import settingsRoute from "./api/settings";
import databaseRoute from "./api/database";

const app = express();

app.use(cors());

app.use(express.json());

app.use("/health", healthRoute);

app.use("/settings", settingsRoute);

app.use("/database", databaseRoute);

export default app;