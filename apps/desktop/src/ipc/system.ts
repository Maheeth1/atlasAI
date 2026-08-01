import { ipcMain } from 'electron'
import os from 'node:os'

export interface SystemInfo {
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

export interface RealtimeStats {
  cpuUsage: number
  memoryUsage: number
  totalMemory: number
  usedMemory: number
}

interface CpuTotals {
  idle: number
  total: number
}

let previousCpuTotals = getCpuTotals()

function getCpuTotals(): CpuTotals {
  return os.cpus().reduce<CpuTotals>(
    (totals, cpu) => {
      const times = cpu.times
      return {
        idle: totals.idle + times.idle,
        total: totals.total + times.user + times.nice + times.sys + times.idle + times.irq
      }
    },
    { idle: 0, total: 0 }
  )
}

function getCpuUsage(): number {
  const current = getCpuTotals()
  const totalDifference = current.total - previousCpuTotals.total
  const idleDifference = current.idle - previousCpuTotals.idle
  previousCpuTotals = current

  if (totalDifference <= 0) return 0
  return Math.max(0, Math.min(100, 100 - (idleDifference / totalDifference) * 100))
}

function getSystemInfo(): SystemInfo {
  const cpus = os.cpus()
  const totalMemory = os.totalmem()
  const freeMemory = os.freemem()

  return {
    cpu: {
      model: cpus[0]?.model ?? 'Unknown processor',
      cores: cpus.length,
      architecture: os.arch()
    },
    memory: {
      total: totalMemory,
      free: freeMemory,
      used: totalMemory - freeMemory
    },
    os: {
      platform: os.platform(),
      release: os.release(),
      hostname: os.hostname()
    }
  }
}

function getRealtimeStats(): RealtimeStats {
  const totalMemory = os.totalmem()
  const usedMemory = totalMemory - os.freemem()

  return {
    cpuUsage: getCpuUsage(),
    memoryUsage: (usedMemory / totalMemory) * 100,
    totalMemory,
    usedMemory
  }
}

export function registerSystemIPC(): void {
  ipcMain.handle('system:info', getSystemInfo)
  ipcMain.handle('system:live', getRealtimeStats)
}
