"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const ADMIN_ITEMS = [
  { href: "/admin/referensi", label: "Referensi Data" },
  { href: "/admin/backup", label: "Backup Data" },
  { href: "/admin/retensi", label: "Retensi Data" },
  { href: "/admin/ltkm", label: "Laporan LTKM" },
];

function isActivePath(href: string, pathname: string): boolean {
  // "/" hanya aktif kalau path persis "/" — kalau tidak, tiap halaman lain
  // (yang selalu mulai dengan "/") ikut menyalakan link Dashboard.
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

const navLinkClass = (isActive: boolean) =>
  "rounded-md px-3 py-2 transition-colors " +
  (isActive
    ? "bg-gray-100 font-semibold text-gray-900"
    : "hover:bg-gray-50 hover:text-gray-900");

/**
 * Halaman "harian" (Dashboard, Buat CDD Baru) tetap tab langsung — dipakai
 * berkali-kali sehari. Empat halaman admin/konfigurasi (jarang dibuka)
 * dikelompokkan ke satu menu Admin mengambang, bukan ikut jadi tab terpisah
 * — supaya top bar tidak terus melebar tiap ada halaman admin baru, dan
 * supaya perbedaan "kerja harian" vs "konfigurasi" terlihat dari struktur
 * menunya sendiri, bukan cuma dari urutan link.
 */
export function SiteNav() {
  const pathname = usePathname();
  const [adminOpen, setAdminOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const adminActive = ADMIN_ITEMS.some((item) => isActivePath(item.href, pathname));

  useEffect(() => {
    if (!adminOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (
        menuRef.current?.contains(e.target as Node) ||
        triggerRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setAdminOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setAdminOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [adminOpen]);

  return (
    <nav className="flex items-center gap-1 text-sm font-medium text-gray-600">
      <Link
        href="/"
        aria-current={pathname === "/" ? "page" : undefined}
        className={navLinkClass(pathname === "/")}
      >
        Dashboard
      </Link>

      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={adminOpen}
          onClick={() => setAdminOpen((v) => !v)}
          className={
            "flex items-center gap-1 " + navLinkClass(adminActive || adminOpen)
          }
        >
          Admin
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={
              "h-3.5 w-3.5 transition-transform " + (adminOpen ? "rotate-180" : "")
            }
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        {adminOpen && (
          <div
            ref={menuRef}
            role="menu"
            aria-label="Menu Admin"
            className="absolute right-0 z-40 mt-1 w-52 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg"
          >
            {ADMIN_ITEMS.map((item) => {
              const isActive = isActivePath(item.href, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setAdminOpen(false)}
                  className={
                    "block px-3 py-2 text-sm " +
                    (isActive
                      ? "bg-gray-50 font-semibold text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900")
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <Link href="/cdd/new" className="btn btn-primary ml-2 px-3 py-2 text-sm">
        + Buat CDD Baru
      </Link>
    </nav>
  );
}
