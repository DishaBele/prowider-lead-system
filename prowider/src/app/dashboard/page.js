"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Nav from "@/components/Nav";

function QuotaBar({ received, quota }) {
  const pct = Math.min((received / quota) * 100, 100);
  const cls = pct >= 100 ? "full" : pct >= 70 ? "warn" : "";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--muted)", marginBottom: 4 }}>
        <span>{received} used</span>
        <span>{quota - received} left</span>
      </div>
      <div className="quota-bar">
        <div className={`quota-fill ${cls}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ProviderCard({ provider }) {
  const remaining = provider.monthlyQuota - provider.leadsReceived;
  return (
    <div className="provider-card">
      <div className="header">
        <span className="provider-name">{provider.name}</span>
        <span className={`badge ${remaining === 0 ? "badge-danger" : remaining <= 3 ? "badge-neutral" : "badge-success"}`}>
          {remaining === 0 ? "QUOTA FULL" : `${remaining} left`}
        </span>
      </div>
      <QuotaBar received={provider.leadsReceived} quota={provider.monthlyQuota} />
      <div style={{ marginTop: "1rem" }}>
        <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: "0.5rem" }}>
          Assigned Leads ({provider.leads.length})
        </div>
        {provider.leads.length === 0 ? (
          <div style={{ fontSize: "0.82rem", color: "var(--muted)", fontStyle: "italic" }}>No leads yet</div>
        ) : (
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {provider.leads.map((lead) => (
              <div key={lead.id} className="lead-row">
                <div>
                  <div className="lead-name">{lead.customerName}</div>
                  <div className="lead-meta">{lead.city} · {lead.service}</div>
                </div>
                <span className="tag">#{lead.id}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [providers, setProviders] = useState([]);
  const [sseStatus, setSseStatus] = useState("connecting");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const notifId = useRef(0);

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch("/api/providers");
      const data = await res.json();
      setProviders(data);
    } catch {
      // silently retry on next SSE event
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();

    const es = new EventSource("/api/sse");

    es.onopen = () => setSseStatus("live");

    es.onmessage = (e) => {
      const payload = JSON.parse(e.data);
      if (payload.type === "CONNECTED") return;
      if (payload.type === "NEW_LEAD") {
        fetchProviders();
        const id = ++notifId.current;
        setNotifications((prev) => [
          { id, lead: payload.lead },
          ...prev.slice(0, 4),
        ]);
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 5000);
      }
    };

    es.onerror = () => {
      setSseStatus("error");
      es.close();
      setTimeout(() => {
        setSseStatus("connecting");
      }, 3000);
    };

    return () => es.close();
  }, [fetchProviders]);

  const totalLeads = providers.reduce((s, p) => s + p.leadsReceived, 0);
  const totalRemaining = providers.reduce((s, p) => s + p.remainingQuota, 0);

  return (
    <>
      <Nav />

      {/* Toast notifications */}
      <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 999, display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: 320 }}>
        {notifications.map((n) => (
          <div key={n.id} className="alert alert-success" style={{ boxShadow: "0 4px 24px rgba(0,212,170,0.2)" }}>
            <strong>New lead #{n.lead.id}</strong>
            <br />
            <span style={{ fontSize: "0.8rem" }}>
              {n.lead.name} · {n.lead.service}
              <br />
              → {n.lead.assignedProviders.join(", ")}
            </span>
          </div>
        ))}
      </div>

      <main className="page">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
          <div>
            <h1 className="page-title">Provider Dashboard</h1>
            <p className="page-subtitle" style={{ marginBottom: 0 }}>
              Live view of all provider quotas and assigned leads.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingTop: "0.5rem" }}>
            <span className="live-dot" style={{ background: sseStatus === "live" ? "var(--accent2)" : sseStatus === "error" ? "var(--error)" : "var(--warning)" }} />
            <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
              {sseStatus === "live" ? "Live" : sseStatus === "error" ? "Reconnecting..." : "Connecting..."}
            </span>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid-4" style={{ marginBottom: "2rem" }}>
          {[
            { label: "Providers", value: providers.length },
            { label: "Total Leads", value: totalLeads },
            { label: "Remaining Slots", value: totalRemaining },
            { label: "Max Capacity", value: providers.length * 10 },
          ].map(({ label, value }) => (
            <div className="card" key={label}>
              <div className="stat-label">{label}</div>
              <div className="stat-value">{loading ? "—" : value}</div>
            </div>
          ))}
        </div>

        {/* Provider grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
            <span className="spinner" style={{ width: 32, height: 32 }} />
            <div style={{ marginTop: "1rem" }}>Loading providers...</div>
          </div>
        ) : (
          <div className="grid-4">
            {providers.map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}