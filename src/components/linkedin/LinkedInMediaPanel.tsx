import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Image as ImageIcon, Film, FileText, Loader2, Trash2, Upload, Library, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteMediaAsset,
  importRemoteMedia,
  listMediaLibrary,
  type MediaAsset,
  type MediaKind,
} from "@/lib/media.functions";
import { StockPickerDialog } from "@/components/stock/StockPickerDialog";

export interface ComposerMedia {
  path: string;
  url: string;
  kind: MediaKind;
  name: string;
  altText?: string;
}

interface Props {
  media: ComposerMedia[];
  onChange: (m: ComposerMedia[]) => void;
}

const MAX_IMAGES = 9;
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

export function LinkedInMediaPanel({ media, onChange }: Props) {
  const [library, setLibrary] = useState<MediaAsset[]>([]);
  const [libOpen, setLibOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const loadLibrary = useServerFn(listMediaLibrary);
  const importRemote = useServerFn(importRemoteMedia);
  const removeAsset = useServerFn(deleteMediaAsset);

  const refresh = async () => {
    const res: any = await loadLibrary({});
    setLibrary(res?.assets || []);
  };

  useEffect(() => {
    if (libOpen) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libOpen]);

  const add = (item: ComposerMedia) => {
    if (item.kind === "image") {
      const images = media.filter((m) => m.kind === "image");
      if (images.length >= MAX_IMAGES) {
        toast.error(`LinkedIn allows up to ${MAX_IMAGES} images per post`);
        return;
      }
      onChange([...images, item]);
    } else {
      onChange([item]); // video / document are exclusive
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Please sign in again.");

      for (const file of Array.from(files)) {
        const kind: MediaKind = file.type.startsWith("video/")
          ? "video"
          : file.type === "application/pdf"
            ? "document"
            : "image";
        if (kind === "video" && file.size > MAX_VIDEO_BYTES) {
          toast.error(`${file.name} is larger than 200MB`);
          continue;
        }
        const safe = file.name.replace(/[^a-zA-Z0-9-_.]/g, "-").slice(-60);
        const path = `${uid}/${Date.now()}-${safe}`;
        const { error } = await supabase.storage
          .from("post-media")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw new Error(error.message);
        const { data: signed } = await supabase.storage
          .from("post-media")
          .createSignedUrl(path, 3600);
        add({ path, url: signed?.signedUrl || "", kind, name: file.name });
      }
      toast.success("Media added");
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const importFromUrl = async (url: string, filename: string, downloadLocation?: string) => {
    setBusy(true);
    try {
      const res: any = await importRemote({ data: { url, filename, downloadLocation } });
      if (res?.error) throw new Error(res.error);
      add({ path: res.path, url: res.url, kind: res.kind, name: filename });
      toast.success("Added from stock library");
    } catch (e: any) {
      toast.error(e?.message || "Could not import that asset");
    } finally {
      setBusy(false);
    }
  };

  const kindIcon = (k: MediaKind) =>
    k === "video" ? <Film className="h-3.5 w-3.5" /> : k === "document" ? <FileText className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,video/mp4,video/quicktime,application/pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Upload
        </button>
        <button
          type="button"
          onClick={() => setStockOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent"
        >
          <Search className="h-3.5 w-3.5" /> Stock library
        </button>
        <button
          type="button"
          onClick={() => setLibOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent"
        >
          <Library className="h-3.5 w-3.5" /> My media
        </button>
        <span className="text-[11px] text-muted-foreground">
          Up to 9 images, one video (200MB) or one PDF carousel.
        </span>
      </div>

      {libOpen && (
        <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto rounded-lg border border-border bg-muted/30 p-2 sm:grid-cols-5">
          {library.length === 0 && (
            <p className="col-span-full py-6 text-center text-xs text-muted-foreground">
              Nothing saved yet — uploads appear here.
            </p>
          )}
          {library.map((a) => (
            <div key={a.path} className="group relative overflow-hidden rounded-md border border-border bg-background">
              <button
                type="button"
                className="block h-20 w-full"
                onClick={() => add({ path: a.path, url: a.url, kind: a.kind, name: a.name })}
              >
                {a.kind === "image" ? (
                  <img src={a.url} alt={a.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                    {kindIcon(a.kind)}
                  </span>
                )}
              </button>
              <button
                type="button"
                aria-label="Delete"
                onClick={async () => {
                  await removeAsset({ data: { path: a.path } });
                  refresh();
                }}
                className="absolute right-1 top-1 rounded bg-background/90 p-1 text-muted-foreground opacity-0 transition group-hover:opacity-100"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {media.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {media.map((m, i) => (
            <div key={m.path + i} className="group relative overflow-hidden rounded-lg border border-border bg-background">
              {m.kind === "image" ? (
                <img src={m.url} alt={m.altText || m.name} className="h-24 w-full object-cover" />
              ) : m.kind === "video" ? (
                <video src={m.url} className="h-24 w-full object-cover" muted playsInline />
              ) : (
                <div className="flex h-24 w-full items-center justify-center text-muted-foreground">
                  <FileText className="h-6 w-6" />
                </div>
              )}
              <button
                type="button"
                aria-label="Remove"
                onClick={() => onChange(media.filter((_, idx) => idx !== i))}
                className="absolute right-1 top-1 rounded bg-background/90 p-1 text-muted-foreground opacity-0 transition group-hover:opacity-100"
              >
                <Trash2 className="h-3 w-3" />
              </button>
              {m.kind === "image" && (
                <input
                  value={m.altText || ""}
                  onChange={(e) =>
                    onChange(media.map((x, idx) => (idx === i ? { ...x, altText: e.target.value } : x)))
                  }
                  placeholder="Alt text"
                  className="w-full border-t border-border bg-background px-2 py-1 text-[10px] text-foreground outline-none"
                />
              )}
            </div>
          ))}
        </div>
      )}

      <StockPickerDialog
        open={stockOpen}
        onClose={() => setStockOpen(false)}
        selectLabel="Add to post"
        title="Add stock media"
        onSelectPhoto={(p) =>
          importFromUrl(p.fullUrl || p.regularUrl, `stock-${p.source}-${p.id}`, p.downloadLocation)
        }
        onSelectVideo={(v) => importFromUrl(v.downloadUrl, `stock-video-${v.id}`)}
      />
    </div>
  );
}
