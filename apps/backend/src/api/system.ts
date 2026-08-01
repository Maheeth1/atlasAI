import { Router } from "express";
import { systemService } from "../system/SystemService";

const router = Router();

router.get("/", async (_, res) => {
    res.json(await systemService.getSystemInfo());
});

router.get("/live", async (_, res) => {
    res.json(await systemService.getRealtimeStats());
});

export default router;