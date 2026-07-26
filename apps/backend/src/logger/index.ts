import pino from "pino";
import { env } from "../config/env";

export const logger = pino({
    level: env.LOG_LEVEL,

    transport: {
        target: "pino-pretty",

        options: {
            colorize: true,

            translateTime: "SYS:standard",

            ignore: "pid,hostname",
        },
    },
});

export const backendLogger = logger.child({
    module: "Backend",
});

export const apiLogger = logger.child({
    module: "API",
});

export const databaseLogger = logger.child({
    module: "Database",
});

export const systemLogger = logger.child({
    module: "System",
});