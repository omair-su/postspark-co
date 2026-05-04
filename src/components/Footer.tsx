import { Link } from "@tanstack/react-router";
import { PostSparkLogo } from "@/components/PostSparkLogo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <PostSparkLogo variant="wordmark" size={32} />
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Notice</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link to="/refunds" className="hover:text-foreground transition-colors">Refund Policy</Link>
            <a href="mailto:hello@postspark.co" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          © 2026 Postspark.co. All rights reserved. Our order process is conducted by our online reseller Paddle.com, which is the Merchant of Record for all our orders.
        </p>
      </div>
    </footer>
  );
}
