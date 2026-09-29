"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  Boxes,
  LayoutDashboard,
  LogOut,
  Package,
  Ruler,
  Settings,
  Users,
} from "lucide-react";
import type { SessionUser } from "@raqs/shared";
import { initials } from "@/lib/utils";

const adminLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/measurements", label: "Measurements", icon: Ruler },
  { href: "/measurement-conversions", label: "Conversions", icon: ArrowLeftRight },
  { href: "/users", label: "Users", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

const staffLinks = [
  { href: "/products", label: "Products", icon: Package },
  { href: "/inventory", label: "Inventory", icon: Boxes },
];

export function Sidebar({ user, onNavigate }: { user: SessionUser; onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = user.role === "ADMIN" ? adminLinks : staffLinks;

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  }

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex items-center gap-3 px-4 py-5">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary"
          aria-hidden
        >
          {initials(user.name || user.username)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{user.name || user.username}</p>
          <p className="text-xs text-muted">{user.role}</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Primary">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                active ? "bg-primary text-on-primary" : "text-ink hover:bg-primary-50"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={() => void signOut()}
        className="m-3 flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-ink hover:bg-primary-50"
      >
        <LogOut className="h-4 w-4" aria-hidden />
        Sign out
      </button>
    </div>
  );
}
