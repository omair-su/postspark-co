import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { importGoogleDriveFile, listGoogleDriveFiles } from "@/lib/google.functions";
import { DriveMimeIcon, GoogleDriveIcon } from "./GoogleIcons";
import { useGoogleStatus } from "./useGoogle";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  isFolder: boolean;
}

export interface GoogleDriveFilePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fires with the extracted plain text once a document is imported. */
  onImported: (payload: { text: string; title: string; webViewLink?: string }) => void;
}

export function GoogleDriveFilePicker({
  open,
  onOpenChange,
  onImported,
}: GoogleDriveFilePickerProps) {
  const { status, loading: statusLoading, connect, authHeaders } = useGoogleStatus();
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [trail, setTrail] = useState<Array<{ id: string | null; name: string }>>([
    { id: null, name: "My Drive" },
  ]);

  const folderId = trail[trail.length - 1]?.id ?? null;

  const load = async (opts: { folderId?: string | null; search?: string } = {}) => {
    if (!status?.connected) return;
    setBusy(true);
    try {
      const r: any = await listGoogleDriveFiles({
        data: {
          folderId: opts.folderId ?? folderId,
          search: (opts.search ?? search).trim() || undefined,
        },
        ...authHeaders,
      });
      setFiles(r.files ?? []);
    } catch (e: any) {
      toast.error(e?.message || "Could not list your Drive files.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (open && status?.connected) load({ folderId: null, search: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, status?.connected]);

  const openFolder = (f: DriveFile) => {
    const next = [...trail, { id: f.id, name: f.name }];
    setTrail(next);
    setSearch("");
    load({ folderId: f.id, search: "" });
  };

  const goBack = () => {
    if (trail.length < 2) return;
    const next = trail.slice(0, -1);
    setTrail(next);
    load({ folderId: next[next.length - 1].id, search: "" });
  };

  const pick = async (f: DriveFile) => {
    if (f.isFolder) return openFolder(f);
    setImportingId(f.id);
    try {
      const r: any = await importGoogleDriveFile({ data: { fileId: f.id }, ...authHeaders });
      onImported({ text: r.text, title: r.title, webViewLink: r.webViewLink });
      toast.success(`Imported “${r.title}”`);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Import failed.");
    } finally {
      setImportingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GoogleDriveIcon size={20} /> Import from Google Drive
          </DialogTitle>
          <DialogDescription>
            Google Docs, PDFs, Word files and plain text are converted to editable text.
          </DialogDescription>
        </DialogHeader>

        {statusLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !status?.configured ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Google Workspace isn't configured for this workspace yet.
          </p>
        ) : !status.connected ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <GoogleDriveIcon size={40} />
            <p className="max-w-sm text-sm text-muted-foreground">
              Connect your Google account to browse and import documents straight from Drive.
            </p>
            <Button onClick={() => connect()}>Connect Google Drive</Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              {trail.length > 1 && (
                <Button variant="outline" size="icon" onClick={goBack} aria-label="Back">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && load()}
                  placeholder="Search your Drive…"
                  className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <Button variant="secondary" onClick={() => load()} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              {trail.map((t) => t.name).join(" / ")}
            </p>

            <div className="max-h-[45vh] divide-y divide-border overflow-y-auto rounded-lg border border-border">
              {busy && files.length === 0 && (
                <div className="flex justify-center py-10 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}
              {!busy && files.length === 0 && (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Nothing here. Try searching by file name.
                </p>
              )}
              {files.map((f) => (
                <button
                  key={f.id}
                  onClick={() => pick(f)}
                  disabled={!!importingId}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/60 disabled:opacity-60"
                >
                  <DriveMimeIcon mimeType={f.mimeType} />
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">{f.name}</span>
                  {f.modifiedTime && (
                    <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                      {new Date(f.modifiedTime).toLocaleDateString()}
                    </span>
                  )}
                  {importingId === f.id && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                </button>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default GoogleDriveFilePicker;
