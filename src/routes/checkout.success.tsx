import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/checkout/success")({
  head: () => ({
    meta: [
      { title: "Welcome to PostSpark" },
      { name: "description", content: "Your PostSpark subscription is active. Head to your dashboard to start repurposing long-form content into posts for every platform." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Welcome to PostSpark" },
      { property: "og:description", content: "Your PostSpark subscription is active. Head to your dashboard to start repurposing long-form content into posts for every platform." },
      { property: "og:url", content: "https://postspark.co/checkout/success" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://postspark.co/checkout/success" }],
  }),
  component: CheckoutSuccess,
});

function CheckoutSuccess() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center animate-fade-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-foreground">You're in! 🎉</h1>
        <p className="mt-3 text-muted-foreground">
          Your subscription is active and your account is unlocked.
          A welcome email is on its way.
        </p>
        <Link
          to="/dashboard"
          className="mt-8 inline-flex items-center justify-center rounded-lg gradient-electric px-6 py-3 text-sm font-semibold text-primary-foreground glow-electric transition-all hover:opacity-90"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
