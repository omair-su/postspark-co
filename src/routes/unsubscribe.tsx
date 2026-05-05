import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";

const searchSchema = z.object({ token: z.string().optional() });

export const Route = createFileRoute("/unsubscribe")({
  validateSearch: searchSchema,
  component: UnsubscribePage,
  head: () => ({ meta: [{ title: "Unsubscribe — PostSpark" }] }),
});

function UnsubscribePage() {
  const { token } = Route.useSearch();
  const [state, setState] = useState<"loading" | "ready" | "already" | "invalid" | "submitting" | "done" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    fetch(`/email/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          setState("invalid");
          return;
        }
        if (data.valid === false && data.reason === "already_unsubscribed") {
          setState("already");
        } else if (data.valid) {
          setState("ready");
        } else {
          setState("invalid");
        }
      })
      .catch(() => setState("invalid"));
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState("submitting");
    try {
      const r = await fetch("/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await r.json();
      if (data.success) setState("done");
      else if (data.reason === "already_unsubscribed") setState("already");
      else {
        setErrorMsg(data.error || "Could not process unsubscribe.");
        setState("error");
      }
    } catch {
      setErrorMsg("Network error.");
      setState("error");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold text-gradient mb-3">PostSpark</h1>

        {state === "loading" && <p className="text-muted-foreground">Loading…</p>}

        {state === "ready" && (
          <>
            <h2 className="text-lg font-semibold text-foreground">Unsubscribe from PostSpark emails?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You'll stop receiving non-essential emails from us.
            </p>
            <Button onClick={confirm} className="mt-6 w-full">Confirm unsubscribe</Button>
          </>
        )}

        {state === "submitting" && <p className="text-muted-foreground">Processing…</p>}

        {state === "done" && (
          <>
            <h2 className="text-lg font-semibold text-foreground">You're unsubscribed</h2>
            <p className="mt-2 text-sm text-muted-foreground">You won't receive further emails of this type.</p>
          </>
        )}

        {state === "already" && (
          <>
            <h2 className="text-lg font-semibold text-foreground">Already unsubscribed</h2>
            <p className="mt-2 text-sm text-muted-foreground">This address was already unsubscribed.</p>
          </>
        )}

        {state === "invalid" && (
          <>
            <h2 className="text-lg font-semibold text-foreground">Invalid link</h2>
            <p className="mt-2 text-sm text-muted-foreground">This unsubscribe link is invalid or expired.</p>
          </>
        )}

        {state === "error" && (
          <>
            <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
            <p className="mt-2 text-sm text-muted-foreground">{errorMsg}</p>
          </>
        )}
      </div>
    </div>
  );
}
