import { useEffect, useState } from 'react'

interface SystemInfo {
  cpu: { model: string; cores: number; architecture: string }
  memory: { total: number; free: number; used: number }
  os: { platform: string; release: string; hostname: string }
}

interface RealtimeStats {
  cpuUsage: number
  memoryUsage: number
  totalMemory: number
  usedMemory: number
}

function formatBytes(value: number): string {
  if (!value) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1)
  return `${(value / 1024 ** exponent).toFixed(exponent < 3 ? 0 : 1)} ${units[exponent]}`
}

function percentage(value: number): string {
  return `${Math.round(value)}%`
}

function App(): React.JSX.Element {
  const [system, setSystem] = useState<SystemInfo | null>(null)
  const [stats, setStats] = useState<RealtimeStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  useEffect(() => {
    let active = true

    const load = async (): Promise<void> => {
      try {
        const [nextSystem, nextStats] = await Promise.all([
          window.atlas.getSystemInfo(),
          window.atlas.getRealtimeStats()
        ])
        if (!active) return
        setSystem(nextSystem)
        setStats(nextStats)
        setUpdatedAt(new Date())
        setError(null)
      } catch {
        if (active) setError('System metrics are temporarily unavailable.')
      }
    }

    const initialLoad = window.setTimeout(() => void load(), 0)
    const timer = window.setInterval(() => void load(), 2_000)
    return () => {
      active = false
      window.clearTimeout(initialLoad)
      window.clearInterval(timer)
    }
  }, [])

  return (
    <main className="desktop-shell">
      <header className="desktop-header">
        <div className="desktop-brand">
          <span>AI</span>
          <div>
            <strong>AtlasAI</strong>
            <small>Desktop monitor</small>
          </div>
        </div>
        <div className="live-indicator">
          <i /> Live system metrics
        </div>
      </header>

      <section className="desktop-content">
        <div className="welcome-row">
          <div>
            <p className="kicker">Local workspace</p>
            <h1>Your system, at a glance.</h1>
          </div>
          <p className="updated">
            {updatedAt
              ? `Updated ${updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
              : 'Connecting…'}
          </p>
        </div>

        {error && <p className="desktop-error">{error}</p>}

        <section className="desktop-metrics">
          <article>
            <p>CPU usage</p>
            <strong>{stats ? percentage(stats.cpuUsage) : '—'}</strong>
            <div className="desktop-meter">
              <span style={{ width: `${stats?.cpuUsage ?? 0}%` }} />
            </div>
            <small>{system ? `${system.cpu.cores} logical cores` : 'Reading hardware'}</small>
          </article>
          <article>
            <p>Memory usage</p>
            <strong>{stats ? percentage(stats.memoryUsage) : '—'}</strong>
            <div className="desktop-meter">
              <span style={{ width: `${stats?.memoryUsage ?? 0}%` }} />
            </div>
            <small>
              {stats
                ? `${formatBytes(stats.usedMemory)} of ${formatBytes(stats.totalMemory)}`
                : 'Reading memory'}
            </small>
          </article>
          <article>
            <p>Available memory</p>
            <strong>{system ? formatBytes(system.memory.free) : '—'}</strong>
            <div className="availability">
              <span>●</span> Ready for local tasks
            </div>
            <small>
              {system ? `${formatBytes(system.memory.total)} installed` : 'Reading capacity'}
            </small>
          </article>
        </section>

        <section className="desktop-details">
          <article className="machine-card">
            <div className="card-title">
              <h2>Machine details</h2>
              <span>Local only</span>
            </div>
            <dl>
              <div>
                <dt>Device</dt>
                <dd>{system?.os.hostname ?? '—'}</dd>
              </div>
              <div>
                <dt>Processor</dt>
                <dd>{system?.cpu.model ?? '—'}</dd>
              </div>
              <div>
                <dt>Architecture</dt>
                <dd>{system?.cpu.architecture ?? '—'}</dd>
              </div>
              <div>
                <dt>Operating system</dt>
                <dd>{system ? `${system.os.platform} ${system.os.release}` : '—'}</dd>
              </div>
            </dl>
          </article>
          <article className="focus-card">
            <p className="kicker">Private by design</p>
            <h2>All monitoring data stays on this computer.</h2>
            <p>
              AtlasAI reads these operating-system metrics through its local desktop bridge. Nothing
              is sent anywhere.
            </p>
          </article>
        </section>
      </section>
    </main>
  )
}

export default App
