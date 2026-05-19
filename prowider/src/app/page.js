import Link from "next/link";
import Nav from "@/components/Nav";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="page" style={{ textAlign: "center", paddingTop: "5rem" }}>
        <span className="badge badge-accent">Lead Distribution System</span>
        <h1 className="page-title" style={{ fontSize: "3rem", margin: "1rem 0" }}>
          Prowider
        </h1>
        <p className="page-subtitle" style={{ maxWidth: 500, margin: "0 auto 2.5rem" }}>
          A smart, fair, real-time lead distribution system.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/request-service" className="btn btn-primary">
            Submit a Service Request →
          </Link>
          <Link href="/dashboard" className="btn btn-ghost">
            View Provider Dashboard
          </Link>
        </div>
      </main>
    </>
  );
}