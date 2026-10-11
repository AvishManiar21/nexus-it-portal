// Site-wide constants shared by the header, footer, metadata and sitemap.

export const SITE_NAME = "Nexus IT Solutions";

export const SITE_DESCRIPTION =
  "Cloud infrastructure, cybersecurity and analytics solutions for businesses that need IT to be dependable.";

// Public base URL, used for canonical links, Open Graph and the sitemap.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const NAV_LINKS = [
  { href: "/products", label: "Solutions" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const FOOTER_LINKS = {
  Company: [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/rfd", label: "Request a demo" },
  ],
  Product: [
    { href: "/products", label: "Solutions" },
    { href: "/features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
} as const;
