import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/refunds")({
  head: () => ({
    meta: [
      { title: "Refund Policy — PostSpark" },
      { name: "description", content: "PostSpark's 30-day money-back guarantee and how to request a refund via Paddle." },
      { property: "og:title", content: "Refund Policy — PostSpark" },
      { property: "og:description", content: "PostSpark's 30-day money-back guarantee and how to request a refund via Paddle." },
    ],
  }),
  component: RefundsPage,
});

function RefundsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-4xl font-bold text-foreground">Refund Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: May 4, 2026</p>

        <div className="mt-10 space-y-8 text-foreground/90 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold mb-3">30-day money-back guarantee</h2>
            <p>
              <strong>Postspark.co</strong> offers a <strong>30-day money-back guarantee</strong> on paid PostSpark
              subscriptions (Pro and Agency). If you are not satisfied with your purchase, you can request a full
              refund within 30 days of your initial order date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">How to request a refund</h2>
            <p>
              Our payments are processed by our Merchant of Record, <strong>Paddle</strong>. To request a refund:
            </p>
            <ol className="list-decimal pl-6 mt-2 space-y-1">
              <li>Visit <a href="https://paddle.net" target="_blank" rel="noopener noreferrer" className="underline">paddle.net</a> and look up your order using the email address you used to purchase.</li>
              <li>Or email us at <a href="mailto:hello@postspark.co" className="underline">hello@postspark.co</a> and we will help you initiate the refund with Paddle.</li>
            </ol>
            <p className="mt-2">
              Refunds are typically processed back to your original payment method within 5–10 business days, depending
              on your bank or card issuer.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Subscription cancellations</h2>
            <p>
              You can cancel your subscription at any time from your account settings. Cancellation takes effect at the
              end of your current billing period — you keep access to your paid plan until then. After that, your
              account automatically reverts to the Free plan.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Paddle Buyer Terms</h2>
            <p>
              Refunds, chargebacks and billing disputes are governed by the
              {" "}<a href="https://www.paddle.com/legal/refund-policy" target="_blank" rel="noopener noreferrer" className="underline">Paddle Refund Policy</a> and the
              {" "}<a href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener noreferrer" className="underline">Paddle Buyer Terms</a>.
              Statutory consumer rights in your jurisdiction (for example, EU/UK rights of withdrawal) apply in
              addition to this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Contact</h2>
            <p>
              Need help with a refund? Email <a href="mailto:hello@postspark.co" className="underline">hello@postspark.co</a>.
              See also our <Link to="/terms" className="underline">Terms of Service</Link> and <Link to="/privacy" className="underline">Privacy Notice</Link>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
