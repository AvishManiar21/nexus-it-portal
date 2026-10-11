"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FOOTER_LINKS, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import Logo from "./Logo";

export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="mt-auto border-t border-slate-800 bg-ink text-slate-300">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="max-w-sm">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo />
            <span className="font-heading text-lg font-semibold text-white">{SITE_NAME}</span>
          </Link>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-400">{SITE_DESCRIPTION}</p>
        </div>

        {Object.entries(FOOTER_LINKS).map(([group, links]) => (
          <div key={group}>
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-white">{group}</h2>
            <ul className="mt-4 space-y-3">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[15px] text-slate-400 transition-colors duration-150 hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-800">
        <div className="container-page flex flex-col gap-2 py-6 text-sm text-slate-400 sm:flex-row sm:justify-between">
          <p>&copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
          <p>
            <Link href="/admin/login" className="hover:text-slate-300">Admin sign in</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
