"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const path = usePathname();
  return (
    <nav>
      <Link href="/" className="logo">⬡ Prowider</Link>
      <Link href="/request-service" className={path === "/request-service" ? "active" : ""}>
        Request Service
      </Link>
      <Link href="/dashboard" className={path === "/dashboard" ? "active" : ""}>
        Dashboard
      </Link>
      <Link href="/test-tools" className={path === "/test-tools" ? "active" : ""}>
        Test Tools
      </Link>
    </nav>
  );
}