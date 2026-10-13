"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SubSectionsAdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/sections");
  }, [router]);

  return (
    <div style={{ maxWidth: "600px", margin: "80px auto", padding: "32px", textAlign: "center", background: "var(--card-bg, #fff)", border: "1px solid var(--card-border, #e2e8f0)", borderRadius: "16px" }}>
      <div style={{ fontSize: "36px", marginBottom: "12px" }}>📂</div>
      <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary, #0f172a)", marginBottom: "8px" }}>
        Subsections Are Managed Inside Sections
      </h2>
      <p style={{ color: "var(--text-secondary, #64748b)", fontSize: "14px", marginBottom: "20px" }}>
        Subsections and category carousels are unified directly under Homepage Sections. Redirecting you now...
      </p>
      <Link
        href="/admin/sections"
        style={{
          display: "inline-block",
          padding: "10px 24px",
          borderRadius: "10px",
          background: "var(--accent, #6366f1)",
          color: "#fff",
          fontWeight: 700,
          textDecoration: "none"
        }}
      >
        Go to Homepage Sections →
      </Link>
    </div>
  );
}
