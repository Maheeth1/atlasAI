import { Router } from "express";
import { settingsRepository } from "../repositories/settingsRepository";

const router = Router();

router.get("/", (_, res) => {
    res.json(settingsRepository.getAll());
});

router.post("/", (req, res) => {
    const { key, value } = req.body;

    settingsRepository.set(key, value);

    res.json({
        success: true,
    });
});

export default router;