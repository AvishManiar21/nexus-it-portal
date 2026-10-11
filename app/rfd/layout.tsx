import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Request a demo",
  description: "Book a tailored walkthrough of Nexus IT's cloud, analytics and cybersecurity solutions. We review every request within one business day.",
};

export default function RfdLayout({ children }: { children: React.ReactNode }) {
  return children;
}
