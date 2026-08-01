import { Router } from "express";
import { pluginLoader } from "../plugins/PluginLoader";

const router = Router();

router.get("/", (_, res) => {
    res.json(pluginLoader.getPlugins().map(({ name, version }) => ({ name, version })));
});

export default router;
