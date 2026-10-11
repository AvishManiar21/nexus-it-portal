"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV_LINKS, SITE_NAME } from "@/lib/site";
import Logo from "./Logo";

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu after navigating
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on route change
    setOpen(false);
  }, [pathname]);

  if (pathname.startsWith("/admin")) return null;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${SITE_NAME} home`}>
          <Logo />
          <span className="font-heading text-lg font-semibold text-ink">{SITE_NAME}</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`rounded-md px-3 py-2 text-[15px] font-medium transition-colors duration-150 ${
                isActive(link.href) ? "text-brand" : "text-body hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link href="/rfd" className="btn btn-primary">
            Request a demo
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-ink hover:bg-canvas md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Main" className="border-t border-line bg-white md:hidden">
          <div className="container-page flex flex-col py-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`rounded-md px-3 py-3 text-base font-medium ${
                  isActive(link.href) ? "bg-brand-soft text-brand" : "text-body hover:bg-canvas"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/rfd" className="btn btn-primary mt-3">
              Request a demo
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
