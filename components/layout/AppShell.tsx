"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOBILE_PRIMARY_ROUTES, ROUTES, ROUTE_GROUPS } from "./routes";
import { LocalStorageStatus } from "./LocalStorageStatus";

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-6">
      {ROUTE_GROUPS.map((group) => (
        <div key={group}>
          <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
            {group}
          </div>
          <ul className="flex flex-col gap-1">
            {ROUTES.filter((r) => r.group === group).map((route) => {
              const active = pathname === route.href;
              const Icon = route.icon;
              return (
                <li key={route.href}>
                  <Link
                    href={route.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-11 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-sm transition-colors",
                      active
                        ? "bg-[var(--color-violet-surface)] text-[var(--color-text)]"
                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]",
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span>{route.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function DesktopSidebar() {
  return (
    <aside
      className="hidden xl:flex xl:w-56 xl:shrink-0 xl:flex-col xl:border-r xl:border-[var(--color-divider)] xl:bg-[var(--color-surface)]"
      aria-label="Sidebar"
    >
      <div className="flex h-[72px] items-center px-5">
        <Link href="/" className="font-[family-name:var(--font-heading)] text-lg font-medium">
          Resonance Lab
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <NavList />
      </div>
      <div className="border-t border-[var(--color-divider)] p-3">
        <LocalStorageStatus />
      </div>
    </aside>
  );
}

function NavigationRail({ onOpenDrawer }: { onOpenDrawer: () => void }) {
  const pathname = usePathname();
  return (
    <aside
      className="hidden lg:flex xl:hidden lg:w-[72px] lg:shrink-0 lg:flex-col lg:items-center lg:border-r lg:border-[var(--color-divider)] lg:bg-[var(--color-surface)] lg:py-3 lg:gap-1"
      aria-label="Navigation rail"
    >
      <button
        onClick={onOpenDrawer}
        className="mb-2 flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>
      {ROUTES.map((route) => {
        const active = pathname === route.href;
        const Icon = route.icon;
        return (
          <Link
            key={route.href}
            href={route.href}
            aria-current={active ? "page" : undefined}
            title={route.label}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)]",
              active
                ? "bg-[var(--color-violet-surface)] text-[var(--color-text)]"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]",
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">{route.label}</span>
          </Link>
        );
      })}
    </aside>
  );
}

function NavigationDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-30 lg:hidden">
      <div className="absolute inset-0 bg-[var(--color-overlay)]" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className="absolute left-0 top-0 h-full w-[288px] max-w-[calc(100vw-32px)] overflow-y-auto bg-[var(--color-surface)] p-4 shadow-[var(--shadow-dialog)]"
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="font-[family-name:var(--font-heading)] text-lg font-medium">Resonance Lab</span>
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <NavList onNavigate={onClose} />
        <div className="mt-6 border-t border-[var(--color-divider)] pt-3">
          <LocalStorageStatus />
        </div>
      </div>
    </div>
  );
}

function CompactHeader({ onOpenDrawer }: { onOpenDrawer: () => void }) {
  const pathname = usePathname();
  const current = ROUTES.find((r) => r.href === pathname);
  return (
    <header className="flex h-14 items-center gap-3 border-b border-[var(--color-divider)] bg-[var(--color-surface)] px-4 lg:hidden">
      <button
        onClick={onOpenDrawer}
        className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>
      <span className="text-sm font-semibold">{current?.label ?? "Resonance Lab"}</span>
    </header>
  );
}

function MobileNavigation({ onOpenDrawer }: { onOpenDrawer: () => void }) {
  const pathname = usePathname();
  const primary = ROUTES.filter((r) => MOBILE_PRIMARY_ROUTES.includes(r.href));
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-30 flex h-16 border-t border-[var(--color-divider)] bg-[var(--color-surface)] pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {primary.map((route) => {
        const active = pathname === route.href;
        const Icon = route.icon;
        return (
          <Link
            key={route.href}
            href={route.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-xs",
              active ? "text-[var(--color-violet)]" : "text-[var(--color-text-secondary)]",
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span>{route.label.split(" ")[0]}</span>
          </Link>
        );
      })}
      <button
        onClick={onOpenDrawer}
        className="flex flex-1 flex-col items-center justify-center gap-1 text-xs text-[var(--color-text-secondary)]"
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
        <span>More</span>
      </button>
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <DesktopSidebar />
      <NavigationRail onOpenDrawer={() => setDrawerOpen(true)} />
      <NavigationDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <CompactHeader onOpenDrawer={() => setDrawerOpen(true)} />
        <main id="main-content" className="min-w-0 flex-1 pb-24 md:pb-8">
          {children}
        </main>
      </div>
      <MobileNavigation onOpenDrawer={() => setDrawerOpen(true)} />
    </div>
  );
}
