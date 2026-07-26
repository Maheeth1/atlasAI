import { Router } from "express";
import { database } from "../database/database";

const router = Router();

router.get("/", (_, res) => {
    try {
        database.connection().prepare("SELECT 1").get();

        res.json({
            connected: true,
            status: "healthy",
        });
    } catch {
        res.status(500).json({
            connected: false,
            status: "error",
        });
    }
});

export default router;