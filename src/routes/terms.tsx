import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — PostSpark" },
      { name: "description", content: "PostSpark Terms of Service governing use of our AI content repurposing platform." },
      { property: "og:title", content: "Terms of Service — PostSpark" },
      { property: "og:description", content: "PostSpark Terms of Service governing use of our AI content repurposing platform." },
      { property: "og:url", content: "https://postspark.co/terms" },
      { property: "og:image", content: "https://postspark.co/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:image", content: "https://postspark.co/og-image.png" },
    ],
    links: [{ rel: "canonical", href: "https://postspark.co/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-4xl font-bold text-foreground">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: May 4, 2026</p>

        <div className="mt-10 space-y-8 text-foreground/90 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Who we are</h2>
            <p>
              These Terms of Service ("Terms") are a legal agreement between you and <strong>Postspark.co</strong>
              ("PostSpark", "we", "us"), the operator of the PostSpark service available at postspark.co (the "Service").
              By creating an account or using the Service you agree to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Acceptance and authority</h2>
            <p>
              By using the Service you confirm you are at least the legal age of majority in your jurisdiction and, if
              you are using the Service on behalf of an organization, you have authority to bind that organization to
              these Terms. Continued use of the Service constitutes acceptance of any updates to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. The Service</h2>
            <p>
              PostSpark is an AI-powered content repurposing platform that transforms blog posts, PDFs, YouTube videos
              and other source material into social media posts, email newsletters, scripts and related formats. Plan
              entitlements (Free, Pro, Agency) determine usage limits and feature access.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Account and credentials</h2>
            <p>
              You must provide accurate information when registering and keep it up to date. You are responsible for
              maintaining the confidentiality of your account credentials and for all activity that occurs under your
              account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Acceptable use</h2>
            <p>You agree not to misuse the Service. You will not:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>use the Service for any unlawful, fraudulent, deceptive or harmful purpose;</li>
              <li>infringe intellectual property, privacy or other rights of third parties;</li>
              <li>upload malware, attempt to probe, scan or breach security, or interfere with the Service;</li>
              <li>scrape, reverse engineer, resell or redistribute the Service or its outputs in bulk;</li>
              <li>circumvent usage limits, plan restrictions or technical safeguards.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. AI-generated content</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>You are responsible for the prompts you submit and for verifying the accuracy and suitability of any output before publishing or relying on it.</li>
              <li>You must have all necessary rights to any content you upload or input. Do not use the Service to generate illegal content, deepfakes, hate speech, malware, or content that infringes third-party rights.</li>
              <li>AI outputs may be inaccurate, incomplete or biased. The Service is not a substitute for professional, legal, financial or medical advice.</li>
              <li>We may remove, restrict or refuse outputs and may suspend accounts that repeatedly violate these rules. Rights holders may submit takedown requests via our contact channels.</li>
              <li>As between you and us, you retain ownership of your inputs and your outputs, subject to a limited license granted to us to host and process them to provide the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Intellectual property</h2>
            <p>
              The Service, including software, branding, documentation and design, is owned by PostSpark and protected
              by intellectual property laws. We grant you a limited, non-exclusive, non-transferable right to use the
              Service in accordance with your selected plan.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Payments, subscriptions and Merchant of Record</h2>
            <p>
              Our order process is conducted by our online reseller <strong>Paddle.com</strong>. Paddle.com is the
              Merchant of Record for all our orders. Paddle provides all customer service inquiries and handles
              returns. Payment, billing, taxes, renewals, cancellations and refund mechanics are governed by the
              {" "}<a href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener noreferrer" className="underline">Paddle Buyer Terms</a>.
            </p>
            <p className="mt-2">
              Subscriptions renew automatically each billing period until cancelled. Plan upgrades and downgrades take
              effect immediately and are pro-rated by Paddle. Cancellation takes effect at the end of the current
              billing period; you retain access until then.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Service level and warranties</h2>
            <p>
              The Service is provided on an "as is" and "as available" basis. We do not guarantee that the Service will
              be uninterrupted, error-free or meet your specific requirements. To the fullest extent permitted by law,
              we disclaim all implied warranties, including merchantability and fitness for a particular purpose.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Liability</h2>
            <p>
              To the maximum extent permitted by law, our aggregate liability arising out of or relating to the Service
              shall not exceed the fees you paid to us (via Paddle) in the twelve months preceding the event giving
              rise to the claim. We are not liable for indirect, incidental, special, consequential or punitive damages,
              including loss of profits, data or goodwill. Nothing in these Terms excludes liability for fraud, death
              or personal injury caused by negligence, or any other liability that cannot be excluded by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. Indemnity</h2>
            <p>
              You agree to indemnify and hold PostSpark harmless from claims arising out of your content, your use of
              the Service, or your violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">12. Suspension and termination</h2>
            <p>
              We may suspend or terminate your access for material breach of these Terms, non-payment, security or
              fraud risk, or repeated or serious policy violations. Upon termination your right to use the Service
              ends; you may request export of your data within a reasonable window before deletion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">13. Changes to the Service or Terms</h2>
            <p>
              We may modify the Service or these Terms from time to time. Material changes will be communicated via
              the Service or by email. Continued use after changes take effect constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">14. Governing law</h2>
            <p>
              These Terms are governed by the laws applicable at the seller's place of establishment, without regard to
              conflict-of-law rules. Disputes shall be resolved in the competent courts of that jurisdiction, unless
              mandatory consumer protection law provides otherwise.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">15. Force majeure and assignment</h2>
            <p>
              Neither party is liable for failures caused by events beyond reasonable control. You may not assign these
              Terms without our consent; we may assign them in connection with a merger, acquisition or reorganization.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">16. Contact</h2>
            <p>
              Questions about these Terms? Contact us at <a href="mailto:hello@postspark.co" className="underline">hello@postspark.co</a>.
              See also our <Link to="/privacy" className="underline">Privacy Notice</Link> and <Link to="/refunds" className="underline">Refund Policy</Link>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
