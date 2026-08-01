import { ElectronAPI } from '@electron-toolkit/preload'

interface SystemInfo {
  cpu: {
    model: string
    cores: number
    architecture: string
  }
  memory: {
    total: number
    free: number
    used: number
  }
  os: {
    platform: string
    release: string
    hostname: string
  }
}

interface RealtimeStats {
  cpuUsage: number
  memoryUsage: number
  totalMemory: number
  usedMemory: number
}

interface AtlasAPI {
  getSystemInfo: () => Promise<SystemInfo>
  getRealtimeStats: () => Promise<RealtimeStats>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AtlasAPI
    atlas: AtlasAPI
  }
}
