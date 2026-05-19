"use client";
import { useState } from "react";
import Nav from "@/components/Nav";

function LogEntry({ entry }) {
  const color = entry.type === "success" ? "var(--accent2)" : entry.type === "error" ? "var(--error)" : "var(--warning)";
  return (
    <div style={{ borderBottom: "1px solid var(--border)", padding: "0.6rem 0", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
      <span style={{ color: "var(--muted)" }}>[{entry.time}]</span>{" "}
      <span style={{ color }}>{entry.type.toUpperCase()}</span>{" "}
      {entry.message}
    </div>
  );
}

export default function TestToolsPage() {
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState({});
  const [webhookKey, setWebhookKey] = useState("key-" + Date.now());

  function addLog(type, message) {
    const time = new Date().toLocaleTimeString();
    setLog((prev) => [{ type, message, time }, ...prev].slice(0, 50));
  }

  function setLoad(key, val) {
    setLoading((prev) => ({ ...prev, [key]: val }));
  }

  async function resetQuota() {
    const key = `reset-${Date.now()}`;
    setLoad("reset", true);
    addLog("info", `Calling webhook with key: ${key}`);
    try {
      const res = await fetch("/api/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "PAYMENT_SUCCESS", idempotencyKey: key }),
      });
      const data = await res.json();
      addLog("success", data.message || "Quota reset.");
    } catch {
      addLog("error", "Webhook call failed.");
    } finally {
      setLoad("reset", false);
    }
  }

  async function testIdempotency() {
    setLoad("idempotency", true);
    addLog("info", `Sending same webhook key 5 times: ${webhookKey}`);
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () =>
        fetch("/api/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "PAYMENT_SUCCESS", idempotencyKey: webhookKey }),
        }).then((r) => r.json())
      )
    );
    const processed = results.filter((r) => r.status === "fulfilled" && !r.value.alreadyProcessed).length;
    const deduped = results.filter((r) => r.status === "fulfilled" && r.value.alreadyProcessed).length;
    addLog(
      processed <= 1 ? "success" : "error",
      `Processed: ${processed} time(s). Deduplicated: ${deduped} time(s). ${processed <= 1 ? "✅ Idempotency working!" : "❌ Idempotency BROKEN!"}`
    );
    setLoad("idempotency", false);
  }

  async function generateLeads() {
    setLoad("leads", true);
    addLog("info", "Generating 10 leads simultaneously...");
    try {
      const res = await fetch("/api/test-tools/generate-leads", { method: "POST" });
      const data = await res.json();
      addLog("success", `Done: ${data.succeeded.length} leads created. ${data.failed.length} failed.`);
      data.succeeded.forEach((lead) => {
        addLog("success", `Lead #${lead.leadId} → ${lead.assignedProviders.join(", ")}`);
      });
      if (data.failed.length) {
        addLog("error", `Failures: ${data.failed.join(" | ")}`);
      }
    } catch {
      addLog("error", "Lead generation failed.");
    } finally {
      setLoad("leads", false);
    }
  }

  return (
    <>
      <Nav />
      <main className="page">
        <h1 className="page-title">Test Tools</h1>
        <p className="page-subtitle">
          Simulate payment webhooks, test idempotency, and stress-test concurrency.
          <br />
          <span style={{ color: "var(--error)" }}>⚠ For evaluators only — not accessible from normal user UI.</span>
        </p>

        <div className="grid-3" style={{ marginBottom: "2rem" }}>
          {/* Reset Quota */}
          <div className="card">
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "0.5rem" }}>
              🔄 Reset Provider Quota
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: "1rem" }}>
              Simulates a successful payment webhook. Resets all provider
              leadsReceived to 0 (quota back to 10). A new unique idempotency key
              is used each time you click.
            </p>
            <button className="btn btn-success btn-full" onClick={resetQuota} disabled={loading.reset}>
              {loading.reset ? <><span className="spinner" /> Resetting...</> : "Reset All Quotas via Webhook"}
            </button>
          </div>

          {/* Idempotency test */}
          <div className="card">
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "0.5rem" }}>
              🔒 Test Idempotency
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: "0.75rem" }}>
              Calls the webhook 5 times simultaneously with the same key.
              Only ONE should apply — the rest deduplicated.
            </p>
            <div className="form-group">
              <label>Fixed idempotency key</label>
              <input
                value={webhookKey}
                onChange={(e) => setWebhookKey(e.target.value)}
                placeholder="Idempotency key"
              />
            </div>
            <button className="btn btn-primary btn-full" onClick={testIdempotency} disabled={loading.idempotency}>
              {loading.idempotency ? <><span className="spinner" /> Testing...</> : "Fire 5× Same Key"}
            </button>
          </div>

          {/* Concurrency test */}
          <div className="card">
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: "0.5rem" }}>
              ⚡ Concurrency Test
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: "1rem" }}>
              Creates 10 leads simultaneously to verify the allocation engine
              handles concurrent requests correctly.
            </p>
            <button className="btn btn-danger btn-full" onClick={generateLeads} disabled={loading.leads}>
              {loading.leads ? <><span className="spinner" /> Generating...</> : "Generate 10 Leads Now"}
            </button>
          </div>
        </div>

        {/* Log output */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Activity Log</div>
            <button className="btn btn-ghost" style={{ padding: "0.35rem 0.8rem", fontSize: "0.75rem" }} onClick={() => setLog([])}>
              Clear
            </button>
          </div>
          {log.length === 0 ? (
            <div style={{ color: "var(--muted)", fontSize: "0.82rem", fontStyle: "italic" }}>
              Actions you take above will appear here...
            </div>
          ) : (
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {log.map((entry, i) => <LogEntry key={i} entry={entry} />)}
            </div>
          )}
        </div>
      </main>
    </>
  );
}