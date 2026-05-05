import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/hooks/useAuth";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { lazy, Suspense } from "react";

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

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PostSpark — AI Content Repurposing Tool" },
      { name: "description", content: "PostSpark uses AI to instantly repurpose your blog posts, PDFs, and YouTube videos into tweets, LinkedIn posts, email newsletters, and video scripts." },
      { name: "keywords", content: "AI content repurposing, repurpose blog posts, content creator tool, AI writing tool, LinkedIn post generator, tweet generator, email newsletter generator" },
      { name: "author", content: "PostSpark" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" },
      { property: "og:site_name", content: "PostSpark" },
      { property: "og:title", content: "PostSpark — Turn 1 Post Into 30 Instantly" },
      { property: "og:description", content: "AI-powered content repurposing for creators and agencies." },
      { property: "og:url", content: "https://postspark.co" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://postspark.co/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@postspark" },
      { name: "twitter:title", content: "PostSpark — AI Content Repurposing" },
      { name: "twitter:description", content: "Turn 1 blog post into 30 pieces of content instantly." },
      { name: "twitter:image", content: "https://postspark.co/og-image.png" },
      { name: "theme-color", content: "#1a1a2e" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://cdn.gpteng.co", crossOrigin: "anonymous" },
      { rel: "preload", href: "https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2", as: "font", type: "font/woff2", crossOrigin: "anonymous" },
      { rel: "preload", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap", as: "style" },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "canonical", href: "https://postspark.co" },
    ],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(ORG_JSONLD) },
      { type: "application/ld+json", children: JSON.stringify(SITE_JSONLD) },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
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
  return (
    <AuthProvider>
      <PaymentTestModeBanner />
      <Outlet />
      <Suspense fallback={null}><Toaster position="top-right" richColors /></Suspense>
    </AuthProvider>
  );
}
