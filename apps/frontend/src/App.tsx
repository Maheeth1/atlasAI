import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { DashboardData } from "./services/dashboard";
import { getDashboardData, saveSetting } from "./services/dashboard";
import "./App.css";

type View = "overview" | "settings";

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** exponent).toFixed(exponent < 3 ? 0 : 1)} ${units[exponent]}`;
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [view, setView] = useState<View>("overview");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const nextData = await getDashboardData();
      setData(nextData);
      setError(null);
    } catch {
      setError("AtlasAI cannot reach its local backend. Start the backend and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(() => void refresh(), 5_000);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(timer);
    };
  }, [refresh]);

  async function submitSetting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!key.trim() || saving) return;

    setSaving(true);
    try {
      await saveSetting(key.trim(), value);
      setKey("");
      setValue("");
      await refresh();
    } catch {
      setError("The setting could not be saved. Keys may contain letters, numbers, dots, hyphens, and underscores.");
    } finally {
      setSaving(false);
    }
  }

  const primaryDisk = data?.system.storage[0];

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">A</span>
          <div>
            <strong>AtlasAI</strong>
            <span>Local control plane</span>
          </div>
        </div>

        <nav aria-label="Workspace navigation">
          <button className={view === "overview" ? "nav-item active" : "nav-item"} onClick={() => setView("overview")}>
            <span aria-hidden="true">◈</span> Overview
          </button>
          <button className={view === "settings" ? "nav-item active" : "nav-item"} onClick={() => setView("settings")}>
            <span aria-hidden="true">⚙</span> Settings
          </button>
        </nav>

        <div className="connection-status">
          <span className={data ? "status-dot" : "status-dot offline"} />
          {data ? "Backend connected" : "Backend unavailable"}
        </div>
      </aside>

      <section className="content">
        <header className="page-header">
          <div>
            <p className="eyebrow">{view === "overview" ? "Workspace overview" : "Configuration"}</p>
            <h1>{view === "overview" ? "Good to see you." : "Settings"}</h1>
          </div>
          <button className="refresh-button" onClick={() => void refresh()} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </button>
        </header>

        {error && <div className="error-banner" role="alert">{error}</div>}

        {view === "overview" && (
          <>
            <section className="hero-card">
              <div>
                <p className="eyebrow">Local assistant</p>
                <h2>{data?.health.service ?? "AtlasAI Backend"}</h2>
                <p>Monitor the services and hardware that power your local workspace.</p>
              </div>
              <div className="health-pill">
                <span className={data?.health.status === "running" ? "status-dot" : "status-dot offline"} />
                {data?.health.status ?? "Waiting for backend"}
              </div>
            </section>

            <section className="metric-grid" aria-label="Realtime system metrics">
              <article className="metric-card">
                <span className="metric-label">CPU load</span>
                <strong>{data ? formatPercent(data.live.cpuUsage) : "—"}</strong>
                <div className="meter"><span style={{ width: `${Math.min(data?.live.cpuUsage ?? 0, 100)}%` }} /></div>
                <small>{data?.system.cpu.cores ?? "—"} logical cores</small>
              </article>
              <article className="metric-card">
                <span className="metric-label">Memory</span>
                <strong>{data ? formatPercent(data.live.memoryUsage) : "—"}</strong>
                <div className="meter"><span style={{ width: `${Math.min(data?.live.memoryUsage ?? 0, 100)}%` }} /></div>
                <small>{data ? `${formatBytes(data.live.usedMemory)} of ${formatBytes(data.live.totalMemory)}` : "Collecting data"}</small>
              </article>
              <article className="metric-card">
                <span className="metric-label">Storage</span>
                <strong>{primaryDisk ? formatPercent(primaryDisk.use) : "—"}</strong>
                <div className="meter"><span style={{ width: `${Math.min(primaryDisk?.use ?? 0, 100)}%` }} /></div>
                <small>{primaryDisk ? `${formatBytes(primaryDisk.used)} of ${formatBytes(primaryDisk.size)}` : "No disk data"}</small>
              </article>
            </section>

            <section className="detail-grid">
              <article className="panel">
                <div className="panel-heading"><h2>System</h2><span>Local machine</span></div>
                <dl className="details-list">
                  <div><dt>Processor</dt><dd>{data?.system.cpu.brand ?? "—"}</dd></div>
                  <div><dt>Operating system</dt><dd>{data ? `${data.system.os.distro} ${data.system.os.release}` : "—"}</dd></div>
                  <div><dt>Physical cores</dt><dd>{data?.system.cpu.physicalCores ?? "—"}</dd></div>
                  <div><dt>Last update</dt><dd>{data ? formatTimestamp(data.health.timestamp) : "—"}</dd></div>
                </dl>
              </article>

              <article className="panel">
                <div className="panel-heading"><h2>Plugins</h2><span>{data?.plugins.length ?? 0} loaded</span></div>
                {data?.plugins.length ? (
                  <ul className="plugin-list">
                    {data.plugins.map((plugin) => <li key={plugin.name}><span className="plugin-icon">↗</span><div><strong>{plugin.name}</strong><small>Version {plugin.version}</small></div><span className="plugin-ready">Ready</span></li>)}
                  </ul>
                ) : <p className="empty-state">No plugins are currently loaded.</p>}
              </article>
            </section>
          </>
        )}

        {view === "settings" && (
          <section className="settings-layout">
            <article className="panel setting-form-panel">
              <div className="panel-heading"><h2>Add or update a setting</h2><span>Stored locally</span></div>
              <form onSubmit={submitSetting}>
                <label htmlFor="setting-key">Key</label>
                <input id="setting-key" value={key} onChange={(event) => setKey(event.target.value)} placeholder="e.g. theme" maxLength={128} required />
                <label htmlFor="setting-value">Value</label>
                <textarea id="setting-value" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Enter a value" maxLength={10_000} rows={4} />
                <button className="primary-button" type="submit" disabled={saving}>{saving ? "Saving…" : "Save setting"}</button>
              </form>
            </article>
            <article className="panel">
              <div className="panel-heading"><h2>Saved settings</h2><span>{data?.settings.length ?? 0} total</span></div>
              {data?.settings.length ? (
                <ul className="settings-list">
                  {data.settings.map((setting) => <li key={setting.id}><div><strong>{setting.key}</strong><small>Updated {formatTimestamp(setting.updated_at)}</small></div><code>{setting.value || "(empty)"}</code></li>)}
                </ul>
              ) : <p className="empty-state">Your saved local settings will appear here.</p>}
            </article>
          </section>
        )}
      </section>
    </main>
  );
}
