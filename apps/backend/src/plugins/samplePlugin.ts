import { Plugin } from "./Plugin";
import { logger } from "../logger";

export const samplePlugin: Plugin = {
    name: "Sample Plugin",

    version: "1.0.0",

    async init() {
        logger.info("Sample Plugin Initialized");
    },

    async dispose() {
        logger.info("Sample Plugin Disposed");
    },
};