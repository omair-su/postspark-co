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

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PostSpark — AI Content Repurposing Tool" },
      { name: "description", content: "PostSpark uses AI to instantly repurpose your blog posts, PDFs, and YouTube videos into tweets, LinkedIn posts, email newsletters, and video scripts." },
      { property: "og:title", content: "PostSpark — One Piece of Content. Endless Reach." },
      { property: "og:description", content: "PostSpark uses AI to instantly repurpose your blog posts, PDFs, and YouTube videos into tweets, LinkedIn posts, email newsletters, and video scripts." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "PostSpark — One Piece of Content. Endless Reach." },
      { name: "twitter:description", content: "PostSpark uses AI to instantly repurpose your blog posts, PDFs, and YouTube videos into tweets, LinkedIn posts, email newsletters, and video scripts." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1d946f5a-c6ce-46a2-a40d-55d378ed499c/id-preview-466ff4c0--d2e3f4c5-af50-4937-a780-34a6f78348f7.lovable.app-1777569993081.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1d946f5a-c6ce-46a2-a40d-55d378ed499c/id-preview-466ff4c0--d2e3f4c5-af50-4937-a780-34a6f78348f7.lovable.app-1777569993081.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://cdn.gpteng.co", crossOrigin: "anonymous" },
      { rel: "preload", href: "https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2", as: "font", type: "font/woff2", crossOrigin: "anonymous" },
      { rel: "preload", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap", as: "style" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "apple-touch-icon", href: "/favicon.svg" },
      { rel: "manifest", href: "/manifest.json" },
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
