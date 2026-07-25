import express from "express";
import cors from "cors";
import healthRoute from "./routes/health.route";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRoute);

export default app;