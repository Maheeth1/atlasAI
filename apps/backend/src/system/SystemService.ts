import si from "systeminformation";

export class SystemService {
    async getSystemInfo() {
        const [
            cpu,
            mem,
            graphics,
            os,
            disk,
        ] = await Promise.all([
            si.cpu(),
            si.mem(),
            si.graphics(),
            si.osInfo(),
            si.fsSize(),
        ]);

        return {
            cpu: {
                manufacturer: cpu.manufacturer,
                brand: cpu.brand,
                cores: cpu.cores,
                physicalCores: cpu.physicalCores,
                speed: cpu.speed,
            },

            memory: {
                total: mem.total,
                free: mem.available,
                used: mem.used,
            },

            gpu: graphics.controllers,

            os: {
                platform: os.platform,
                distro: os.distro,
                release: os.release,
            },

            storage: disk,
        };
    }

    async getRealtimeStats() {
        const [load, mem] = await Promise.all([
            si.currentLoad(),
            si.mem(),
        ]);

        return {
            cpuUsage: load.currentLoad,

            memoryUsage:
                (mem.used / mem.total) * 100,

            usedMemory: mem.used,

            freeMemory: mem.available,

            totalMemory: mem.total,
        };
    }
}

export const systemService = new SystemService();