import { Task } from "./Task";
import { logger } from "../logger";
import { eventBus } from "../events/eventBus";
import { Events } from "../events/events";

export class TaskQueue {
    private queue: Task[] = [];

    private running = false;

    add(task: Task) {
        this.queue.push(task);

        logger.info(`Task Added -> ${task.name}`);

        this.process();
    }

    private async process() {
        if (this.running) return;

        this.running = true;

        while (this.queue.length > 0) {
            const task = this.queue.shift()!;

            eventBus.emit(Events.JOB_STARTED, task);

            try {
                await task.execute();

                eventBus.emit(Events.JOB_FINISHED, task);
            } catch (err) {
                eventBus.emit(Events.JOB_FAILED, task);

                logger.error(err);
            }
        }

        this.running = false;
    }
}

export const taskQueue = new TaskQueue();