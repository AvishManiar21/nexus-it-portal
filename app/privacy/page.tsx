import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/site/LegalPage";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE_NAME} collects, uses and protects your information.`,
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 11, 2026">
      <section>
        <h2>Who we are</h2>
        <p>
          This policy explains how {SITE_NAME} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) handles information collected
          through this website. For any privacy question or request, use our{" "}
          <Link href="/contact" className="font-semibold text-brand hover:text-brand-hover">contact form</Link>.
        </p>
      </section>

      <section>
        <h2>Information you give us</h2>
        <p>When you request a demo or send us a message, we collect what you enter in the form:</p>
        <ul>
          <li>Your name, email address, phone number and company name</li>
          <li>Your budget range and the solutions you are interested in</li>
          <li>The subject and content of your message</li>
        </ul>
        <p>We use this to respond to you, prepare demos and proposals, and send a confirmation email.</p>
      </section>

      <section>
        <h2>Information collected automatically</h2>
        <ul>
          <li>
            <strong>Visitor cookie.</strong> We set a cookie named <code>visitor_session_id</code>, a random identifier
            that lasts one year. We use it to record which solution pages you view and when you start or finish a demo
            video. If you later submit a form, this browsing history is linked to your details so our team can understand
            your interests.
          </li>
          <li>
            <strong>Technical data.</strong> Your IP address is used briefly to limit repeated form submissions and protect
            against abuse. It is not stored with your details.
          </li>
          <li>
            <strong>Admin session cookie.</strong> Staff who sign in to the admin area receive a session cookie that is
            required for that area to work.
          </li>
        </ul>
      </section>

      <section>
        <h2>Third-party services</h2>
        <ul>
          <li><strong>Database hosting:</strong> your information is stored with our database provider (Supabase).</li>
          <li><strong>Email delivery:</strong> confirmation and notification emails are sent through our email provider.</li>
          <li>
            <strong>Embedded videos:</strong> demo videos are embedded from YouTube, which may set its own cookies when
            you play a video. See Google&rsquo;s privacy policy for details.
          </li>
        </ul>
        <p>We do not sell your personal information.</p>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <p>
          We keep enquiry and lead information for as long as needed to respond to you and manage our relationship, and
          then delete or anonymize it. [Set a specific retention period before launch.]
        </p>
      </section>

      <section>
        <h2>Your choices and rights</h2>
        <ul>
          <li>You can ask to see, correct or delete the information we hold about you.</li>
          <li>You can block or delete cookies in your browser settings. The site still works without the visitor cookie.</li>
          <li>Depending on where you live, you may have additional rights under local law (for example GDPR or CCPA).</li>
        </ul>
      </section>

      <section>
        <h2>Changes to this policy</h2>
        <p>We will update the date at the top of this page when this policy changes.</p>
      </section>
    </LegalPage>
  );
}
