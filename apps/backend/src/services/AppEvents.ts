import { eventBus } from "../events/eventBus";
import { Events } from "../events/events";
import { logger } from "../logger";

eventBus.on(Events.PLUGIN_LOADED, (plugin) => {
    logger.info(`Plugin Loaded -> ${plugin.name}`);
});

eventBus.on(Events.PLUGIN_UNLOADED, (plugin) => {
    logger.info(`Plugin Unloaded -> ${plugin.name}`);
});

eventBus.on(Events.SETTINGS_UPDATED, (setting) => {
    logger.info(`Setting Updated -> ${setting?.key ?? "unknown"}`);
});

eventBus.on(Events.JOB_STARTED, (job) => {
    logger.info(`Job Started -> ${job.name}`);
});

eventBus.on(Events.JOB_FINISHED, (job) => {
    logger.info(`Job Finished -> ${job.name}`);
});

eventBus.on(Events.JOB_FAILED, (job) => {
    logger.error(`Job Failed -> ${job.name}`);
});
