import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/data-deletion")({
  head: () => ({
    meta: [
      { title: "Data Deletion Instructions — PostSpark" },
      { name: "description", content: "How to request deletion of your PostSpark account and personal data, including data obtained via connected social accounts (Meta, Instagram, Threads, TikTok, LinkedIn)." },
      { property: "og:title", content: "Data Deletion Instructions — PostSpark" },
      { property: "og:description", content: "Request deletion of your PostSpark account and any data PostSpark received from connected social platforms." },
      { property: "og:url", content: "https://postspark.co/data-deletion" },
    ],
    links: [{ rel: "canonical", href: "https://postspark.co/data-deletion" }],
  }),
  component: DataDeletionPage,
});

function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-4xl font-bold text-foreground">User Data Deletion Instructions</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: June 24, 2026</p>

        <div className="mt-10 space-y-8 text-foreground/90 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold mb-3">Overview</h2>
            <p>
              PostSpark ("we", "us") lets you connect third-party social accounts (including Meta /
              Facebook, Instagram, Threads, TikTok and LinkedIn) so you can repurpose and publish
              content. This page explains how to delete your PostSpark account and any personal
              data we received from those connected platforms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Option 1 — Delete from your account settings</h2>
            <ol className="list-decimal pl-6 space-y-1">
              <li>Sign in at <a href="https://postspark.co/login" className="underline">postspark.co/login</a>.</li>
              <li>Go to <strong>Dashboard → Settings</strong>.</li>
              <li>Scroll to <strong>Danger Zone</strong> and click <strong>Delete account</strong>.</li>
              <li>Confirm. Your account, generated content, brand data, and tokens from connected
                social platforms (Meta, Instagram, Threads, TikTok, LinkedIn) are permanently
                deleted within 30 days.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Option 2 — Email request</h2>
            <p>
              If you cannot sign in, email <a href="mailto:hello@postspark.co" className="underline">hello@postspark.co</a> from
              the address associated with your PostSpark account with the subject line
              <strong> "Data Deletion Request"</strong>. Include the connected platform (e.g. Meta /
              Facebook user ID, Instagram handle) if you want data tied to that connection removed.
            </p>
            <p className="mt-2">
              We respond within 72 hours and complete deletion within 30 days, in line with our{" "}
              <Link to="/privacy" className="underline">Privacy Notice</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">What gets deleted</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Your PostSpark profile, email and authentication records.</li>
              <li>Access and refresh tokens for connected Meta, Instagram, Threads, TikTok and LinkedIn accounts.</li>
              <li>Imported posts, captions, media metadata and analytics fetched from those platforms.</li>
              <li>Generated content, brand kit, brand voice samples and uploaded assets.</li>
            </ul>
            <p className="mt-2 text-sm text-muted-foreground">
              We may retain limited records required by law (e.g. tax / billing) in anonymized form.
              Disconnecting at the social platform (e.g. Facebook → Settings → Apps and Websites →
              PostSpark → Remove) also revokes our access going forward.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Contact</h2>
            <p>
              Questions? <a href="mailto:hello@postspark.co" className="underline">hello@postspark.co</a>.
              See also our <Link to="/privacy" className="underline">Privacy Notice</Link>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
