"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  BookMarked,
  BookOpen,
  BrainCircuit,
  Clock,
  FilePlus2,
  Fingerprint,
  Image as ImageIcon,
  LayoutDashboard,
  Lock,
  Menu,
  Scale,
  ShieldCheck,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import { logout } from "@/lib/actions/auth";

const ADMIN_ITEMS = [
  { href: "/admin/referensi", label: "Referensi Data", icon: BookOpen },
  { href: "/admin/backup", label: "Backup Data", icon: Archive },
  { href: "/admin/retensi", label: "Retensi Data", icon: Clock },
  { href: "/admin/ltkm", label: "Laporan LTKM", icon: TriangleAlert },
  { href: "/admin/ai-processing", label: "AI Processing", icon: BrainCircuit },
  { href: "/admin/knowledge-base", label: "Knowledge Base", icon: BookMarked },
  { href: "/admin/appearance", label: "Tampilan", icon: ImageIcon },
];

function isActivePath(href: string, pathname: string): boolean {
  // "/" hanya aktif kalau path persis "/" — kalau tidak, tiap halaman lain
  // (yang selalu mulai dengan "/") ikut menyalakan link Dashboard.
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
        active
          ? "bg-brand-subtle font-semibold text-brand-hover"
          : "font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.25 : 1.9} />
      {label}
    </Link>
  );
}

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-5 pb-1 pt-6"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-soft-sm">
          <Scale className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
        <span className="text-[15px] font-bold leading-tight text-slate-900">
          Notary CDD
          <span className="block text-[11px] font-medium text-muted">
            &amp; Risk Assessment
          </span>
        </span>
      </Link>

      <div className="px-4 pt-5">
        <Link
          href="/cdd/new"
          onClick={onNavigate}
          className="btn btn-primary w-full px-4 py-2.5 text-sm"
        >
          <FilePlus2 className="h-4 w-4" strokeWidth={2} />
          Buat CDD Baru
        </Link>
      </div>

      <nav className="mt-6 flex-1 space-y-6 overflow-y-auto px-4 pb-4">
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Menu
          </p>
          <NavLink
            href="/"
            label="Dashboard"
            icon={LayoutDashboard}
            active={pathname === "/"}
            onNavigate={onNavigate}
          />
          <NavLink
            href="/cases"
            label="Cases"
            icon={Fingerprint}
            active={isActivePath("/cases", pathname)}
            onNavigate={onNavigate}
          />
        </div>

        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Administrasi
          </p>
          {ADMIN_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActivePath(item.href, pathname)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </nav>

      <div className="border-t border-border-subtle px-4 py-4">
        <div className="mb-3 flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-brand shadow-soft-sm">
            <ShieldCheck className="h-4 w-4" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-800">Kantor Notaris</p>
            <p className="truncate text-[11px] text-muted">Sesi aktif &middot; PIN terverifikasi</p>
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="btn btn-ghost w-full justify-start px-3 py-2 text-sm"
          >
            <Lock className="h-4 w-4" strokeWidth={1.9} />
            Kunci Layar
          </button>
        </form>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLockPage = pathname.startsWith("/lock");

  // Tutup drawer mobile saat pindah halaman — disesuaikan langsung di body
  // render (bukan di dalam effect) supaya tidak memicu setState sinkron di
  // effect (lihat https://react.dev/learn/you-might-not-need-an-effect).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  // Halaman /lock belum tentu ada sesi — jangan tampilkan navigasi/aksi
  // "Kunci Layar" di layar login itu sendiri (sama seperti LockButton).
  if (isLockPage) return null;

  return (
    <>
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 rounded-r-3xl border-r border-border-subtle bg-white shadow-soft-sm lg:block">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border-subtle bg-white/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/80 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
            <Scale className="h-4 w-4" strokeWidth={2} />
          </span>
          <span className="text-sm font-bold text-slate-900">Notary CDD</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Buka menu navigasi"
          aria-expanded={mobileOpen}
          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" strokeWidth={2} />
        </button>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Menu navigasi"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="h-full w-64 rounded-r-3xl bg-white shadow-soft-lg"
            >
              <div className="flex justify-end px-3 pt-3">
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Tutup menu"
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="-mt-8">
                <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
