import api from "../api/client";

export interface Health {
    success: boolean;
    service: string;
    status: string;
    timestamp: string;
}

export interface SystemInfo {
    cpu: {
        manufacturer: string;
        brand: string;
        cores: number;
        physicalCores: number;
        speed: string;
    };
    memory: {
        total: number;
        free: number;
        used: number;
    };
    os: {
        platform: string;
        distro: string;
        release: string;
    };
    storage: Array<{
        fs: string;
        size: number;
        used: number;
        use: number;
    }>;
}

export interface LiveStats {
    cpuUsage: number;
    memoryUsage: number;
    usedMemory: number;
    freeMemory: number;
    totalMemory: number;
}

export interface Setting {
    id: number;
    key: string;
    value: string;
    updated_at: string;
}

export interface Plugin {
    name: string;
    version: string;
}

export interface DashboardData {
    health: Health;
    system: SystemInfo;
    live: LiveStats;
    settings: Setting[];
    plugins: Plugin[];
}

export async function getDashboardData(): Promise<DashboardData> {
    const [health, system, live, settings, plugins] = await Promise.all([
        api.get<Health>("/health"),
        api.get<SystemInfo>("/system"),
        api.get<LiveStats>("/system/live"),
        api.get<Setting[]>("/settings"),
        api.get<Plugin[]>("/plugins"),
    ]);

    return {
        health: health.data,
        system: system.data,
        live: live.data,
        settings: settings.data,
        plugins: plugins.data,
    };
}

export async function saveSetting(key: string, value: string): Promise<Setting> {
    const response = await api.post<{ setting: Setting }>("/settings", { key, value });
    return response.data.setting;
}
