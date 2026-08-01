import type { LiveStats, SystemInfo } from "../services/dashboard";

export { };

declare global {
    interface Window {
        atlas: {
            getSystemInfo(): Promise<SystemInfo>;

            getRealtimeStats(): Promise<LiveStats>;
        };
    }
}
