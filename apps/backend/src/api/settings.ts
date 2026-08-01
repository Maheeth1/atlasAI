import { Router } from "express";
import { z } from "zod";
import { eventBus } from "../events/eventBus";
import { Events } from "../events/events";
import { settingsRepository } from "../repositories/settingsRepository";

const router = Router();

const settingSchema = z.object({
    key: z.string().trim().min(1).max(128).regex(/^[a-zA-Z0-9._-]+$/),
    value: z.string().max(10_000),
});

router.get("/", (_, res) => {
    res.json(settingsRepository.getAll());
});

router.post("/", (req, res) => {
    const parsed = settingSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            success: false,
            error: "A setting requires a valid key and a text value.",
        });
    }

    const { key, value } = parsed.data;

    settingsRepository.set(key, value);

    const setting = settingsRepository.get(key);

    eventBus.emit(Events.SETTINGS_UPDATED, setting);

    return res.status(201).json({
        success: true,
        setting,
    });
});

export default router;
