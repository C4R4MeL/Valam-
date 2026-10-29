"use client";

import {
  LayoutDashboard,
  Beaker,
  Users,
  Settings,
  LogOut,
  Leaf,
  BookOpen,
  Recycle,
  X,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { useEffect, useRef } from "react";

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("Navbar");
  const { email, logout } = useAuthContext();
  const panelRef = useRef<HTMLElement>(null);
  const previousPath = useRef(pathname);
  const isId = locale === "id";

  useEffect(() => {
    if (previousPath.current !== pathname) {
      previousPath.current = pathname;
      onClose?.();
    }
  }, [pathname, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const desktop = window.matchMedia("(min-width: 1024px)");
    if (desktop.matches) {
      onClose?.();
      return;
    }
    const previousOverflow = document.body.style.overflow;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const panel = panelRef.current;
    document.body.style.overflow = "hidden";
    panel?.querySelector<HTMLButtonElement>("[data-close-navigation]")?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
      }
      if (event.key !== "Tab" || !panel) return;
      const controls = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex="0"]',
        ),
      );
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first || !last) return;
      if (
        !panel.contains(document.activeElement) ||
        (event.shiftKey && document.activeElement === first) ||
        (!event.shiftKey && document.activeElement === last)
      ) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    const handleBreakpoint = () => {
      if (desktop.matches) onClose?.();
    };
    document.addEventListener("keydown", handleKey);
    desktop.addEventListener("change", handleBreakpoint);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      desktop.removeEventListener("change", handleBreakpoint);
      previousFocus?.focus();
    };
  }, [isOpen, onClose]);

  const navItems = [
    {
      title: t("AdminDashboard"),
      href: "/dashboard/admin",
      icon: LayoutDashboard,
      exact: true,
    },
    { title: t("AntrianQC"), href: "/dashboard/admin/qc", icon: Beaker },
    {
      title: isId ? "Mitra Pengujian" : "Testing Partners",
      href: "/dashboard/admin/testing-partners",
      icon: Beaker,
    },
    {
      title: t("ValidasiSupplier"),
      href: "/dashboard/admin/suppliers",
      icon: Users,
    },
    {
      title: "Circular Products",
      href: "/dashboard/admin/circular-products",
      icon: Recycle,
    },
    {
      title: "Valam Insights",
      href: "/dashboard/admin/insights",
      icon: BookOpen,
    },
  ];
  const active = (href: string, exact = false) =>
    exact
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);
  const focusRing =
    "active:!transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-950";

  return (
    <>
      {isOpen && (
        <button
          type="button"
          tabIndex={-1}
          aria-label={
            isId
              ? "Tutup latar navigasi admin"
              : "Close admin navigation backdrop"
          }
          onClick={onClose}
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm active:!transform-none lg:hidden"
        />
      )}
      {/* One navigation tree; mobile layers also cover the global floating chat widget. */}
      <aside
        ref={panelRef}
        id="admin-sidebar"
        aria-label={isId ? "Navigasi admin" : "Admin navigation"}
        role={isOpen ? "dialog" : undefined}
        aria-modal={isOpen || undefined}
        className={`${isOpen ? "flex" : "hidden"} fixed inset-y-0 left-0 z-[10000] h-dvh w-72 max-w-[calc(100vw-3rem)] shrink-0 flex-col border-r border-emerald-900 bg-emerald-950 text-white shadow-lg lg:sticky lg:top-0 lg:z-30 lg:flex lg:max-w-none`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-emerald-900/50 p-5">
          <Link
            className={`flex min-h-11 items-center gap-3 rounded-lg ${focusRing}`}
            href="/"
            onClick={onClose}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 shadow-lg">
              <Leaf className="h-5 w-5 text-emerald-950" aria-hidden="true" />
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight">
              Valam<span className="text-gold-400">.</span>
            </span>
          </Link>
          <button
            type="button"
            data-close-navigation
            aria-label={isId ? "Tutup menu admin" : "Close admin menu"}
            onClick={onClose}
            className={`flex h-11 w-11 items-center justify-center rounded-lg text-white/80 hover:bg-emerald-900 lg:hidden ${focusRing}`}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain flex flex-col">
          <div className="p-4">
            <h2 className="mb-3 px-3 text-xs font-bold uppercase tracking-widest text-emerald-400">
              {isId ? "Kontrol Admin" : "Admin Control"}
            </h2>
            <nav
              aria-label={isId ? "Menu utama admin" : "Admin main menu"}
              className="space-y-1.5"
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  aria-current={
                    active(item.href, item.exact) ? "page" : undefined
                  }
                  className={`flex min-h-11 w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${focusRing} ${active(item.href, item.exact) ? "border-emerald-700/60 bg-emerald-800/80 font-semibold text-white" : "border-transparent text-emerald-100/80 hover:bg-emerald-900 hover:text-white"}`}
                >
                  <item.icon
                    className={`h-5 w-5 shrink-0 ${active(item.href, item.exact) ? "text-gold-400" : "text-emerald-400"}`}
                    aria-hidden="true"
                  />
                  <span>{item.title}</span>
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-auto shrink-0 border-t border-emerald-900 bg-emerald-950 p-4">
            <div className="mb-3 flex items-center gap-3 rounded-xl border border-emerald-800/50 bg-emerald-900/40 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-700 font-bold">
                {email?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="min-w-0">
                <p
                  className="truncate text-sm font-semibold"
                  title={email || "Admin"}
                >
                  {email || "Admin"}
                </p>
                <p className="text-xs text-emerald-400">Administrator</p>
              </div>
            </div>
            <Link
              href="/dashboard/admin/settings"
              onClick={onClose}
              aria-current={
                active("/dashboard/admin/settings") ? "page" : undefined
              }
              className={`flex min-h-11 items-center gap-3 rounded-lg px-4 py-3 text-sm text-emerald-100/80 hover:bg-emerald-900 hover:text-white ${active("/dashboard/admin/settings") ? "bg-emerald-800/80 text-white" : ""} ${focusRing}`}
            >
              <Settings className="h-4 w-4 shrink-0" aria-hidden="true" />
              {isId ? "Pengaturan" : "Settings"}
            </Link>
            <button
              type="button"
              onClick={() => {
                logout();
                window.location.href = `/${locale}/login`;
              }}
              className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-red-300 hover:bg-red-950/50 hover:text-red-200 ${focusRing}`}
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              {isId ? "Keluar Akun" : "Sign Out"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
