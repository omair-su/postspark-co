import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouter } from "@tanstack/react-router";
import { AuthProvider } from "@/hooks/useAuth";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { lazy, Suspense, useEffect } from "react";
import { captureUTMs, track } from "@/lib/analytics";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

const Toaster = lazy(() => import("sonner").then(m => ({ default: m.Toaster })));

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "PostSpark",
  url: "https://postspark.co",
  logo: "https://postspark.co/og-image.png",
  description:
    "AI content repurposing tool that turns blog posts, PDFs, and YouTube videos into tweets, LinkedIn posts, email newsletters, and video scripts.",
  sameAs: [
    "https://twitter.com/postspark",
    "https://www.linkedin.com/company/postspark",
  ],
};

const SITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "PostSpark",
  url: "https://postspark.co",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://postspark.co/gallery?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

const SITENAV_JSONLD = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: [
    { "@type": "SiteNavigationElement", position: 1, name: "Pricing", url: "https://postspark.co/pricing" },
    { "@type": "SiteNavigationElement", position: 2, name: "Gallery", url: "https://postspark.co/gallery" },
    { "@type": "SiteNavigationElement", position: 3, name: "Blog", url: "https://postspark.co/blog" },
    { "@type": "SiteNavigationElement", position: 4, name: "For Creators", url: "https://postspark.co/for/creators" },
    { "@type": "SiteNavigationElement", position: 5, name: "For Agencies", url: "https://postspark.co/for/agencies" },
    { "@type": "SiteNavigationElement", position: 6, name: "LinkedIn Post Generator", url: "https://postspark.co/features/linkedin-post-generator" },
    { "@type": "SiteNavigationElement", position: 7, name: "YouTube to Tweets", url: "https://postspark.co/features/youtube-to-tweets" },
    { "@type": "SiteNavigationElement", position: 8, name: "Repurpose Blog to Social", url: "https://postspark.co/features/repurpose-blog-to-social" },
    { "@type": "SiteNavigationElement", position: 9, name: "LinkedIn Video Downloader", url: "https://postspark.co/tools/linkedin-video-downloader" },
    { "@type": "SiteNavigationElement", position: 10, name: "AI Image Generator", url: "https://postspark.co/tools/ai-image-generator" },
    { "@type": "SiteNavigationElement", position: 11, name: "YouTube Thumbnail Maker", url: "https://postspark.co/tools/youtube-thumbnail-maker" },
    { "@type": "SiteNavigationElement", position: 12, name: "Hook Generator", url: "https://postspark.co/tools/hook-generator" },
  ],
};

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "author", content: "PostSpark" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" },
      { property: "og:site_name", content: "PostSpark" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/f9070ef5-37e1-4717-bd8a-ca4ad13ad162" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@postspark" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/f9070ef5-37e1-4717-bd8a-ca4ad13ad162" },
      { name: "theme-color", content: "#1a1a2e" },
      { name: "google-site-verification", content: "9HThX3WCpXERfUk5CuePAeDTsykITTG90vg6j9ewhWw" },
      { title: "PostSpark AI | Create Once. Repurpose Every. Publish Instant" },
      { property: "og:title", content: "PostSpark AI | Create Once. Repurpose Every. Publish Instant" },
      { name: "twitter:title", content: "PostSpark AI | Create Once. Repurpose Every. Publish Instant" },
      { name: "description", content: "Generate social posts, X thread, LinkedIn content, blogs, image, shorts, and more from a single video, or idea. Create, repurpose, schedule, and publish with AI" },
      { property: "og:description", content: "Generate social posts, X thread, LinkedIn content, blogs, image, shorts, and more from a single video, or idea. Create, repurpose, schedule, and publish with AI" },
      { name: "twitter:description", content: "Generate social posts, X thread, LinkedIn content, blogs, image, shorts, and more from a single video, or idea. Create, repurpose, schedule, and publish with AI" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://cdn.gpteng.co", crossOrigin: "anonymous" },
      { rel: "preload", href: "https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2", as: "font", type: "font/woff2", crossOrigin: "anonymous" },
      // Non-render-blocking: loaded as a preload and flipped to a stylesheet by the
      // inline script at the end of <body> (a <noscript> fallback covers no-JS).
      { rel: "preload", as: "style", href: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800;900&family=Instrument+Serif:ital@0;1&family=Syne:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.json" },
    ],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(ORG_JSONLD) },
      { type: "application/ld+json", children: JSON.stringify(SITE_JSONLD) },
      { type: "application/ld+json", children: JSON.stringify(SITENAV_JSONLD) },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  // Server renders with `dark` pre-applied so the very first paint on a fresh
  // visit matches our default. The inline script below runs synchronously
  // before HeadContent (and therefore before the stylesheet <link> is parsed),
  // reconciling the class + data-theme + color-scheme with any saved
  // preference to eliminate FOUC / theme flash.
  return (
    <html lang="en" className="dark" data-theme="dark" style={{ colorScheme: "dark" }}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');var d=document.documentElement;var isLight=(t==='light');d.classList.toggle('dark',!isLight);d.classList.toggle('light',isLight);d.setAttribute('data-theme',isLight?'light':'dark');d.style.colorScheme=isLight?'light':'dark';}catch(e){document.documentElement.classList.add('dark');document.documentElement.setAttribute('data-theme','dark');document.documentElement.style.colorScheme='dark';}})();` }} />
        <HeadContent />
        <noscript>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" />
        </noscript>
      </head>
      <body>
        {children}
        <Scripts />
        <script dangerouslySetInnerHTML={{ __html: `document.querySelectorAll('link[rel="preload"][as="style"]').forEach(function(l){l.rel="stylesheet"})` }} />
      </body>
    </html>
  );
}

function RootComponent() {
  const router = useRouter();
  useEffect(() => {
    captureUTMs();
    track("page_view");
    const unsub = router.subscribe("onResolved", () => {
      track("page_view");
    });
    return () => { unsub(); };
  }, [router]);
  return (
    <AuthProvider>
      <PaymentTestModeBanner />
      <Outlet />
      <PWAInstallPrompt />
      <Suspense fallback={null}><Toaster position="top-right" richColors /></Suspense>
    </AuthProvider>
  );
}
