import { TriangleAlert } from "lucide-react";
import PageHeader from "./PageHeader";

// Layout for legal documents. `isTemplate` shows a review notice until a lawyer has approved the text.
export default function LegalPage({
  title,
  updated,
  isTemplate = true,
  children,
}: {
  title: string;
  updated: string;
  isTemplate?: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <PageHeader title={title} intro={`Last updated: ${updated}`} />
      <section className="py-14">
        <div className="container-page">
          {isTemplate && (
            <div role="note" className="mb-10 flex max-w-3xl gap-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-900">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <p>
                <strong>Template.</strong> This document describes how this site handles data, but it has not been
                reviewed by a lawyer. Have it reviewed and adapted to your jurisdiction before launch.
              </p>
            </div>
          )}
          <div className="max-w-3xl space-y-8 text-[17px] leading-relaxed [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_p+p]:mt-3">
            {children}
          </div>
        </div>
      </section>
    </>
  );
}
