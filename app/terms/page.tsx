import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/site/LegalPage";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms for using the ${SITE_NAME} website.`,
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="October 11, 2026">
      <section>
        <h2>About these terms</h2>
        <p>
          These terms apply to your use of this website. Services we provide to customers are governed by the written
          agreement and proposal signed for that engagement, which take precedence over these terms.
        </p>
      </section>

      <section>
        <h2>Using this site</h2>
        <ul>
          <li>Provide accurate information when you submit a form.</li>
          <li>Do not attempt to disrupt the site, access areas you are not authorized to use, or submit automated or abusive requests.</li>
          <li>The admin area is for authorized staff only.</li>
        </ul>
      </section>

      <section>
        <h2>Pricing and information</h2>
        <p>
          Prices on this site are starting prices in USD and exclude applicable taxes. They are not an offer: final pricing
          is set out in a written proposal. We work to keep information accurate but may update it at any time.
        </p>
      </section>

      <section>
        <h2>Intellectual property</h2>
        <p>
          The content, design and branding of this site belong to {SITE_NAME} or its licensors. You may not copy or reuse
          them without permission. Third-party names, images and videos remain the property of their owners.
        </p>
      </section>

      <section>
        <h2>Disclaimer and liability</h2>
        <p>
          This site is provided &ldquo;as is&rdquo; without warranties of any kind. To the extent permitted by law, we are
          not liable for losses arising from your use of the site. [Have counsel set the liability terms for your jurisdiction.]
        </p>
      </section>

      <section>
        <h2>Privacy</h2>
        <p>
          How we handle your information is described in our{" "}
          <Link href="/privacy" className="font-semibold text-brand hover:text-brand-hover">Privacy Policy</Link>.
        </p>
      </section>

      <section>
        <h2>Governing law and changes</h2>
        <p>
          These terms are governed by the laws of [your jurisdiction]. We may update them; the date at the top of this page
          shows the latest version. Questions? <Link href="/contact" className="font-semibold text-brand hover:text-brand-hover">Contact us</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
