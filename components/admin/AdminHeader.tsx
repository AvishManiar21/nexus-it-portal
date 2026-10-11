"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";
import Logo from "@/components/site/Logo";

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/leads", label: "Leads", exact: false },
];

export default function AdminHeader() {
  const pathname = usePathname();
  if (pathname === "/admin/login") return null;

  const isActive = (href: string, exact: boolean) => (exact ? pathname === href : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Logo />
            <span className="font-heading text-base font-semibold text-ink">
              Nexus IT <span className="font-normal text-muted">Admin</span>
            </span>
          </Link>
          <nav aria-label="Admin" className="flex items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href, item.exact) ? "page" : undefined}
                className={`rounded-md px-3 py-2 text-[15px] font-medium transition-colors duration-150 ${
                  isActive(item.href, item.exact) ? "bg-brand-soft text-brand" : "text-body hover:bg-canvas hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="hidden items-center gap-1.5 rounded-md px-3 py-2 text-[15px] text-body hover:bg-canvas sm:inline-flex"
          >
            View site <ExternalLink className="h-4 w-4" aria-hidden />
          </Link>
          <form action={logout}>
            <button type="submit" className="btn btn-secondary min-h-10 px-3 py-2 text-[15px]">
              <LogOut className="h-4 w-4" aria-hidden /> Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
