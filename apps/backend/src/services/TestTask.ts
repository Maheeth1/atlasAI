import { logger } from "../logger";
import crypto from "node:crypto";
import { Task } from "../queue/Task";

export class TestTask implements Task {
    id = crypto.randomUUID();

    name = "Example Task";

    async execute() {
        logger.info("Executing task...");

        await new Promise((resolve) => setTimeout(resolve, 3000));

        logger.info("Task completed.");
    }
}