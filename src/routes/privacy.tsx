import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Notice — PostSpark" },
      { name: "description", content: "How PostSpark collects, uses and protects your personal data." },
      { property: "og:title", content: "Privacy Notice — PostSpark" },
      { property: "og:description", content: "How PostSpark collects, uses and protects your personal data." },
      { property: "og:url", content: "https://postspark.co/privacy" },
      { property: "og:image", content: "https://postspark.co/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:image", content: "https://postspark.co/og-image.png" },
    ],
    links: [{ rel: "canonical", href: "https://postspark.co/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-4xl font-bold text-foreground">Privacy Notice</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: May 4, 2026</p>

        <div className="mt-10 space-y-8 text-foreground/90 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Who we are</h2>
            <p>
              This Privacy Notice explains how <strong>Postspark.co</strong> ("PostSpark", "we", "us") collects, uses
              and protects personal data when you use the PostSpark service at postspark.co. PostSpark acts as the
              <strong> data controller</strong> for personal data described in this Notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Personal data we collect</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Account data:</strong> name, email address, password hash, authentication provider IDs (e.g. Google).</li>
              <li><strong>Profile and brand data:</strong> profile picture, brand kit (logo, colors, fonts, tone) and brand voice samples you upload.</li>
              <li><strong>Content data:</strong> source material you submit (text, URLs, files) and generated outputs.</li>
              <li><strong>Usage and telemetry:</strong> feature usage, requests, error logs, device and browser information, IP address, approximate location, timestamps.</li>
              <li><strong>Support data:</strong> messages and attachments you send to us.</li>
              <li><strong>Marketing data:</strong> email preferences and engagement (opens, clicks) where applicable.</li>
            </ul>
            <p className="mt-2 text-sm text-muted-foreground">
              Payment card details are collected and processed directly by our Merchant of Record, Paddle, and are not
              stored by PostSpark.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Why we use your data and legal basis</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Provide the Service</strong> (account, content generation, brand features) — performance of contract.</li>
              <li><strong>Security and fraud prevention</strong> (rate limiting, abuse detection, audit logs) — legitimate interests and legal obligation.</li>
              <li><strong>Customer support</strong> — performance of contract / legitimate interests.</li>
              <li><strong>Service improvement and analytics</strong> (aggregated usage analysis) — legitimate interests.</li>
              <li><strong>Marketing communications</strong> — consent (you may unsubscribe at any time).</li>
              <li><strong>Legal compliance</strong> (tax, accounting, responding to lawful requests) — legal obligation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Sharing your data</h2>
            <p>We share personal data only with the following categories of recipients:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Paddle (Merchant of Record)</strong> — for the sale of subscriptions, payment processing, subscription management, tax compliance and invoicing. See the <a href="https://www.paddle.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="underline">Paddle Privacy Policy</a>.</li>
              <li><strong>Service providers / subprocessors</strong> — cloud hosting, database, email delivery, analytics, error monitoring, AI inference providers used to power generation features.</li>
              <li><strong>Professional advisers</strong> — accountants, auditors and lawyers when needed.</li>
              <li><strong>Authorities</strong> — where required by law, court order or to protect rights and safety.</li>
            </ul>
            <p className="mt-2">We do not sell your personal data.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. International transfers</h2>
            <p>
              Your data may be processed outside your country of residence, including in the United States. Where we
              transfer personal data from the UK or EEA, we rely on appropriate safeguards such as the European
              Commission's Standard Contractual Clauses or adequacy decisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Data retention</h2>
            <p>
              We retain personal data for as long as your account is active and for as long as needed to provide the
              Service, comply with legal obligations (e.g. tax records), resolve disputes and enforce our agreements.
              When data is no longer needed, we delete or anonymize it. You can request deletion of your account at
              any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Your rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>access the personal data we hold about you;</li>
              <li>request correction of inaccurate data;</li>
              <li>request erasure ("right to be forgotten");</li>
              <li>restrict or object to certain processing;</li>
              <li>data portability;</li>
              <li>withdraw consent at any time (without affecting prior processing);</li>
              <li>lodge a complaint with your local data protection authority.</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, contact <a href="mailto:hello@postspark.co" className="underline">hello@postspark.co</a>.
              We will respond within one month.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect personal data, including
              encryption in transit, access controls, audit logging and least-privilege principles. No system is
              perfectly secure; please use a strong password and protect your credentials.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Cookies</h2>
            <p>
              We use essential cookies needed to operate the Service (authentication, session, security). We may also
              use limited analytics cookies to understand how the Service is used. You can manage cookies via your
              browser settings; disabling essential cookies may break parts of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Children</h2>
            <p>
              The Service is not directed at children under 16. We do not knowingly collect personal data from children.
              If you believe we have, contact us and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. Changes to this Notice</h2>
            <p>
              We may update this Privacy Notice from time to time. We will update the "Last updated" date and, for
              material changes, notify you via the Service or email.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">12. Contact</h2>
            <p>
              Questions about this Notice or our data practices? Contact <a href="mailto:hello@postspark.co" className="underline">hello@postspark.co</a>.
              See also our <Link to="/terms" className="underline">Terms of Service</Link> and <Link to="/refunds" className="underline">Refund Policy</Link>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
