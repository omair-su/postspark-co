import { useState } from "react";
import { toast } from "sonner";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { exportToGoogleDocs } from "@/lib/google.functions";
import { GoogleDocsIcon } from "./GoogleIcons";
import { useGoogleStatus } from "./useGoogle";

export interface ExportToGoogleDocsProps {
  content: string;
  defaultTitle: string;
  sourceTool?: string;
  /** Compact icon-and-label button that fits inline output card action rows. */
  variant?: "inline" | "button";
  className?: string;
}

export function ExportToGoogleDocs({
  content,
  defaultTitle,
  sourceTool,
  variant = "inline",
  className = "",
}: ExportToGoogleDocsProps) {
  const { status, connect, authHeaders } = useGoogleStatus();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(defaultTitle);
  const [busy, setBusy] = useState(false);
  const [docUrl, setDocUrl] = useState<string | null>(null);

  const run = async () => {
    if (!content.trim()) return toast.error("Nothing to export yet.");
    setBusy(true);
    try {
      const r: any = await exportToGoogleDocs({
        data: { title: title.trim() || defaultTitle, content, sourceTool },
        ...authHeaders,
      });
      setDocUrl(r.url);
      toast.success("Saved to Google Docs");
    } catch (e: any) {
      toast.error(e?.message || "Export failed.");
    } finally {
      setBusy(false);
    }
  };

  const openDialog = () => {
    if (!status?.connected) {
      toast.info("Connect Google to export documents.");
      connect();
      return;
    }
    setTitle(defaultTitle);
    setDocUrl(null);
    setOpen(true);
  };

  if (!status?.configured) return null;

  return (
    <>
      {variant === "inline" ? (
        <button
          onClick={openDialog}
          className={`inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-all hover:border-primary hover:text-primary ${className}`}
        >
          <GoogleDocsIcon size={12} /> Google Docs
        </button>
      ) : (
        <Button variant="outline" onClick={openDialog} className={className}>
          <GoogleDocsIcon size={16} /> Export to Google Docs
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GoogleDocsIcon size={20} /> Export to Google Docs
            </DialogTitle>
            <DialogDescription>
              Creates a formatted doc in your <strong>PostSpark Exports</strong> Drive folder.
            </DialogDescription>
          </DialogHeader>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">Document name</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              placeholder="Untitled PostSpark export"
            />
          </label>

          {docUrl && (
            <a
              href={docUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400"
            >
              <Check className="h-4 w-4" /> Open in Google Docs
              <ExternalLink className="ml-auto h-3.5 w-3.5" />
            </a>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button onClick={run} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {docUrl ? "Export again" : "Create document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ExportToGoogleDocs;
