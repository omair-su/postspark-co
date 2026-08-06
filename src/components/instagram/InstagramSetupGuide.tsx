import { useState } from "react";
import { toast } from "sonner";
import { Check, ChevronDown, Copy, ExternalLink, Settings2 } from "lucide-react";
import { IG_SETUP_URLS } from "@/lib/instagramUrls";

function CopyRow({ label, field, url, hint }: { label: string; field: string; url: string; hint?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy — select the URL and copy manually");
    }
  };
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{field}</p>
        </div>
        <button
          type="button"
          onClick={copy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <code className="mt-2 block break-all rounded-lg bg-muted px-2.5 py-2 text-[11px] text-foreground">{url}</code>
      {hint && <p className="mt-1.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function InstagramSetupGuide({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <span className="rounded-lg bg-primary/10 p-2 text-primary">
          <Settings2 className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">Instagram setup guide</span>
          <span className="block text-xs text-muted-foreground">
            The exact callback, deauthorize and data deletion URLs for your Meta app
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="space-y-3 border-t border-border px-5 py-4">
          <ol className="space-y-1.5 text-xs text-muted-foreground">
            <li>1. Open your Meta app (PostSpark-IG) → Instagram → API setup with Instagram login.</li>
            <li>2. Paste each URL below into the matching field and save.</li>
            <li>3. In development mode, add your account under App roles → Instagram Tester and accept the invite.</li>
            <li>4. Come back here and press Connect Instagram.</li>
          </ol>

          <div className="grid gap-3">
            {IG_SETUP_URLS.map((u) => (
              <CopyRow key={u.label} {...u} />
            ))}
          </div>

          <a
            href="https://developers.facebook.com/apps"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            Open Meta app dashboard <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </section>
  );
}
