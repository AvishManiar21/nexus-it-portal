import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions about a solution, pricing or an existing deployment? Message the Nexus IT team; we reply within one business day.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
