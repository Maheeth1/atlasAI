import { useEffect, useState } from "react";
import api from "../api/client";
import type { LiveStats, SystemInfo } from "../services/dashboard";

export function useSystem() {
    const [system, setSystem] =
        useState<SystemInfo | null>(null);

    const [live, setLive] =
        useState<LiveStats | null>(null);

    useEffect(() => {
        const loadSystem = () => api
            .get<SystemInfo>("/system")
            .then((response) => response.data)
            .then(setSystem);

        void loadSystem();

        const timer = setInterval(() => {
            api
                .get<LiveStats>("/system/live")
                .then((response) => response.data)
                .then(setLive);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return {
        system,
        live,
    };
}
