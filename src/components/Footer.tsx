import { Link } from "@tanstack/react-router";
import { PostSparkLogo } from "@/components/PostSparkLogo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <PostSparkLogo variant="wordmark" size={32} />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              PostSpark turns one piece of content into a full week of platform-ready posts. AI repurposing for creators and agencies.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Features</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/features/repurpose-blog-to-social" className="text-muted-foreground hover:text-foreground">Blog → Social</Link></li>
              <li><Link to="/features/youtube-to-tweets" className="text-muted-foreground hover:text-foreground">YouTube → Tweets</Link></li>
              <li><Link to="/features/linkedin-post-generator" className="text-muted-foreground hover:text-foreground">LinkedIn Generator</Link></li>
              <li><Link to="/gallery" className="text-muted-foreground hover:text-foreground">Inspiration Gallery</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Solutions</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/for/creators" className="text-muted-foreground hover:text-foreground">For Creators</Link></li>
              <li><Link to="/for/agencies" className="text-muted-foreground hover:text-foreground">For Agencies</Link></li>
              <li><Link to="/pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link></li>
              <li><Link to="/blog" className="text-muted-foreground hover:text-foreground">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Company</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground">Privacy</Link></li>
              <li><Link to="/terms" className="text-muted-foreground hover:text-foreground">Terms</Link></li>
              <li><Link to="/refunds" className="text-muted-foreground hover:text-foreground">Refunds</Link></li>
              <li><a href="mailto:hello@postspark.co" className="text-muted-foreground hover:text-foreground">Contact</a></li>
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © 2026 Postspark.co. All rights reserved. Our order process is conducted by our online reseller Paddle.com, which is the Merchant of Record for all our orders.
        </p>
      </div>
    </footer>
  );
}
