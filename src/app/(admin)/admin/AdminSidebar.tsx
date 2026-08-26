"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/actions/auth";

const navItems = [
  {
    label: "Visão Geral",
    href: "/admin",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: "Livros",
    href: "/admin/books",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    label: "Usuários",
    href: "/admin/users",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Produtos",
    href: "/admin/products",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
  },
  {
    label: "Testes",
    href: "/admin/emails",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14.5 2v6.5L18 14a4 4 0 0 1-4 6H10a4 4 0 0 1-4-6l3.5-5.5V2" />
        <line x1="9" y1="2" x2="15" y2="2" />
        <line x1="8" y1="14" x2="16" y2="14" />
      </svg>
    ),
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden p-2"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-sm)",
          color: "var(--text-primary)",
        }}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {mobileOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
        </svg>
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 md:hidden" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-60 z-40 flex flex-col transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
        style={{
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border-subtle)",
        }}
      >
        {/* Logo */}
        <div className="p-5 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <img
            src="/logo-reset.png"
            alt="Protocolo Reset"
            className="w-10 h-10 object-contain"
          />
          <div>
            <h1 className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Protocolo Reset</h1>
            <span className="badge badge-admin text-[9px] mt-0.5">Admin</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 mb-0.5 text-sm font-medium transition-colors"
                style={{
                  color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                  background: isActive ? "var(--bg-surface)" : "transparent",
                  borderRadius: "var(--radius-sm)",
                  borderLeft: isActive ? "2px solid var(--accent-orange)" : "2px solid transparent",
                }}
                onClick={() => setMobileOpen(false)}
              >
                <span style={{ color: isActive ? "var(--accent-orange)" : "var(--text-muted)" }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Back + Logout */}
        <div className="p-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 text-xs transition-colors mb-1"
            style={{ color: "var(--text-muted)", borderRadius: "var(--radius-sm)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Voltar à Biblioteca
          </Link>
          <form action={signOut}>
            <button type="submit" className="flex items-center gap-2 px-3 py-2 text-xs w-full text-left transition-colors" style={{ color: "var(--text-muted)", borderRadius: "var(--radius-sm)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sair
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
