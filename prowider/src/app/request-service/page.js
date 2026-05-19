"use client";
import { useState, useEffect } from "react";
import Nav from "@/components/Nav";

export default function RequestServicePage() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({
    name: "", phone: "", city: "", serviceId: "", description: "",
  });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then(setServices);
  }, []);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    if (!/^\d{10}$/.test(form.phone)) {
      setStatus({ type: "error", message: "Phone number must be exactly 10 digits." });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, serviceId: Number(form.serviceId) }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: "error", message: data.error });
      } else {
        setStatus({
          type: "success",
          message: `Your request has been submitted! Lead #${data.leadId} assigned to: ${data.assignedProviders.join(", ")}.`,
          data,
        });
        setForm({ name: "", phone: "", city: "", serviceId: "", description: "" });
      }
    } catch {
      setStatus({ type: "error", message: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Nav />
      <main className="page">
        <h1 className="page-title">Request a Service</h1>
        <p className="page-subtitle">
          Fill in your details and we'll connect you with the right providers immediately.
        </p>

        <div style={{ maxWidth: 560 }}>
          {status && (
            <div className={`alert alert-${status.type === "success" ? "success" : "error"}`}>
              {status.message}
            </div>
          )}

          <div className="card">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name" name="name" type="text"
                  placeholder="e.g. Priya Sharma"
                  value={form.name} onChange={handleChange} required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    id="phone" name="phone" type="tel"
                    placeholder="10-digit mobile"
                    maxLength={10}
                    value={form.phone} onChange={handleChange} required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input
                    id="city" name="city" type="text"
                    placeholder="e.g. Bangalore"
                    value={form.city} onChange={handleChange} required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="serviceId">Service Type</label>
                <select
                  id="serviceId" name="serviceId"
                  value={form.serviceId} onChange={handleChange} required
                >
                  <option value="">— Select a service —</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description" name="description"
                  placeholder="Briefly describe what you need..."
                  value={form.description} onChange={handleChange} required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? <><span className="spinner" /> Submitting...</> : "Submit Request →"}
              </button>
            </form>
          </div>

          <div className="card" style={{ marginTop: "1.5rem" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
              <div style={{ marginBottom: "0.5rem", fontWeight: 500, color: "var(--text)" }}>
                ℹ️ How assignment works
              </div>
              <ul style={{ paddingLeft: "1.2rem", lineHeight: 2 }}>
                <li>Every lead is assigned to exactly <strong>3 providers</strong></li>
                <li>Certain providers are <strong>mandatory</strong> per service type</li>
                <li>Remaining slots are filled with <strong>fair round-robin</strong></li>
                <li>Same phone + same service = <strong>duplicate not allowed</strong></li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}