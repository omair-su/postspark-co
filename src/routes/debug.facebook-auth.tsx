import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getFacebookAuthDiagnostics } from "@/lib/metaPublish.functions";

type FacebookAuthDiagnostics = Awaited<ReturnType<typeof getFacebookAuthDiagnostics>>;

export const Route = createFileRoute("/debug/facebook-auth")({
  head: () => ({
    meta: [
      { title: "Facebook Auth Debug — PostSpark" },
      {
        name: "description",
        content: "Diagnostic view for PostSpark Facebook OAuth redirect URI configuration.",
      },
      { property: "og:title", content: "Facebook Auth Debug — PostSpark" },
      {
        property: "og:description",
        content: "Diagnostic view for PostSpark Facebook OAuth redirect URI configuration.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: FacebookAuthDebugPage,
});

function FacebookAuthDebugPage() {
  const [diagnostics, setDiagnostics] = useState<FacebookAuthDiagnostics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getFacebookAuthDiagnostics()
      .then((result) => {
        if (cancelled) return;
        console.info("[Meta OAuth Debug] Facebook App ID:", result.facebookAppId);
        console.info("[Meta OAuth Debug] OAuth URL:", result.oauthUrl);
        console.info("[Meta OAuth Debug] redirect_uri:", result.redirectUri);
        console.info("[Meta OAuth Debug] callback URI:", result.callbackUri);
        console.info("[Meta OAuth Debug] auth provider:", result.authProvider);
        console.info("[Meta OAuth Debug] current environment:", result.currentEnvironment);
        console.info("[Meta OAuth Debug] redirect checks:", result.checks);
        if (!result.checks.exactMatchToConfiguredMetaRedirect) {
          console.error("[Meta OAuth Debug] redirect_uri mismatch", {
            actual: result.redirectUri,
            expected: result.configuredMetaRedirectUri,
            checks: result.checks,
          });
        }
        setDiagnostics(result);
      })
      .catch((e: unknown) => {
        const message = e instanceof Error ? e.message : String(e);
        if (cancelled) return;
        console.error("[Meta OAuth Debug] failed to load diagnostics", e);
        setError(message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-4xl space-y-4">
        <header>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">PostSpark diagnostics</p>
          <h1 className="mt-2 text-2xl font-bold">Facebook Auth Debug</h1>
          <p className="mt-1 text-sm text-muted-foreground">Read-only OAuth redirect diagnostics.</p>
        </header>

        {error && (
          <section className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </section>
        )}

        {!diagnostics && !error && (
          <section className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            Loading diagnostics…
          </section>
        )}

        {diagnostics && (
          <section className="rounded-lg border border-border bg-card p-4">
            <dl className="grid gap-3 text-sm md:grid-cols-[180px_1fr]">
              <dt className="font-semibold text-muted-foreground">Facebook App ID</dt>
              <dd className="break-all font-mono">{diagnostics.facebookAppId}</dd>

              <dt className="font-semibold text-muted-foreground">OAuth URL</dt>
              <dd className="break-all font-mono">{diagnostics.oauthUrl}</dd>

              <dt className="font-semibold text-muted-foreground">Redirect URI</dt>
              <dd className="break-all font-mono">{diagnostics.redirectUri}</dd>

              <dt className="font-semibold text-muted-foreground">Configured Meta Redirect</dt>
              <dd className="break-all font-mono">{diagnostics.configuredMetaRedirectUri}</dd>

              <dt className="font-semibold text-muted-foreground">Callback URI</dt>
              <dd className="break-all font-mono">{diagnostics.callbackUri}</dd>

              <dt className="font-semibold text-muted-foreground">Managed Auth Callback</dt>
              <dd>{diagnostics.managedAuthCallbackUri}</dd>

              <dt className="font-semibold text-muted-foreground">Auth Provider</dt>
              <dd>{diagnostics.authProvider}</dd>

              <dt className="font-semibold text-muted-foreground">Current Environment</dt>
              <dd>
                <pre className="overflow-auto rounded-md border border-border bg-background p-3 text-xs text-foreground">
                  {JSON.stringify(diagnostics.currentEnvironment, null, 2)}
                </pre>
              </dd>

              <dt className="font-semibold text-muted-foreground">Redirect Checks</dt>
              <dd>
                <pre className="overflow-auto rounded-md border border-border bg-background p-3 text-xs text-foreground">
                  {JSON.stringify(diagnostics.checks, null, 2)}
                </pre>
              </dd>
            </dl>
          </section>
        )}
      </div>
    </main>
  );
}