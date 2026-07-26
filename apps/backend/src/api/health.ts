import { Router } from "express";

const router = Router();

router.get("/", (_, res) => {
    res.json({
        success: true,

        service: "AtlasAI Backend",

        status: "running",

        timestamp: new Date().toISOString(),
    });
});

export default router;