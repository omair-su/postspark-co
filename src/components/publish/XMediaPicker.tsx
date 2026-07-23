import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Upload, Images, Sparkles, Loader2, Check, ImagePlus } from "lucide-react";
import { listLibraryImages, saveImageToLibrary } from "@/lib/image.functions";
import { StockMediaPicker } from "@/components/stock/StockMediaPicker";
import type { StockPhoto, StockVideo } from "@/lib/stockMedia.server";
import { trackUnsplashUse } from "@/lib/stockMedia.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Tab = "upload" | "library" | "stock";

interface Props {
  selected: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

export function XMediaPicker({ selected, onChange, max = 4 }: Props) {
  const [tab, setTab] = useState<Tab>("upload");

  const add = (url: string) => {
    if (selected.includes(url)) return;
    if (selected.length >= max) {
      toast.error(`X allows up to ${max} images per tweet`);
      return;
    }
    onChange([...selected, url]);
  };
  const remove = (url: string) => onChange(selected.filter((u) => u !== url));

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-1 border-b border-border p-1">
        <TabButton active={tab === "upload"} onClick={() => setTab("upload")} icon={<Upload className="h-4 w-4" />}>
          Upload
        </TabButton>
        <TabButton active={tab === "library"} onClick={() => setTab("library")} icon={<Sparkles className="h-4 w-4" />}>
          My library
        </TabButton>
        <TabButton active={tab === "stock"} onClick={() => setTab("stock")} icon={<Images className="h-4 w-4" />}>
          Stock
        </TabButton>
      </div>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2 border-b border-border p-3">
          {selected.map((u) => (
            <div key={u} className="relative h-16 w-16 overflow-hidden rounded-md border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="selected" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => remove(u)}
                className="absolute right-0.5 top-0.5 rounded-full bg-background/80 px-1.5 text-[10px] font-semibold"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="p-3">
        {tab === "upload" ? (
          <UploadTab onUploaded={add} disabled={selected.length >= max} />
        ) : tab === "library" ? (
          <LibraryTab onPick={add} selected={selected} />
        ) : (
          <StockTab onPick={add} />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
        active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

/* ---------- Upload ---------- */

function UploadTab({ onUploaded, disabled }: { onUploaded: (url: string) => void; disabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const doSave = useServerFn(saveImageToLibrary);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Only images are supported for now");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const out: any = await doSave({
        data: {
          imageDataUrl: dataUrl,
          prompt: file.name || "Uploaded image",
          source: "upload",
          safetyCheck: false,
        },
      });
      if (out?.error) {
        toast.error(out.error);
        return;
      }
      if (out?.image?.image_url) {
        onUploaded(out.image.image_url);
        toast.success("Image added");
      }
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <label
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-8 text-center text-sm text-muted-foreground transition hover:border-primary/60 hover:bg-muted/40 ${
        disabled ? "pointer-events-none opacity-50" : ""
      }`}
    >
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        disabled={disabled || busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.currentTarget.value = "";
        }}
      />
      {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
      <div className="font-medium text-foreground">
        {busy ? "Uploading…" : "Click to upload an image"}
      </div>
      <div className="text-xs">PNG, JPG, WEBP, or GIF · up to 5 MB</div>
    </label>
  );
}

/* ---------- My Library ---------- */

function LibraryTab({ onPick, selected }: { onPick: (url: string) => void; selected: string[] }) {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const doList = useServerFn(listLibraryImages);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res: any = await doList({});
        if (!alive) return;
        setImages(res?.images || []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [doList]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading library…
      </div>
    );
  }
  if (images.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        No generated images yet. Create some in Image Studio, then come back.
      </div>
    );
  }
  return (
    <div className="grid max-h-[420px] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
      {images.map((img) => {
        const active = selected.includes(img.image_url);
        return (
          <button
            key={img.id}
            type="button"
            onClick={() => onPick(img.image_url)}
            className={`relative aspect-square overflow-hidden rounded-md border transition ${
              active ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/50"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.image_url} alt={img.prompt || ""} className="h-full w-full object-cover" />
            {active ? (
              <div className="absolute inset-0 grid place-items-center bg-primary/30">
                <Check className="h-6 w-6 text-primary-foreground" />
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Stock ---------- */

function StockTab({ onPick }: { onPick: (url: string) => void }) {
  const doTrack = useServerFn(trackUnsplashUse);

  const onSelectPhoto = (p: StockPhoto) => {
    onPick(p.regularUrl || p.fullUrl || p.thumbUrl);
    if (p.source === "unsplash" && p.downloadLocation) {
      doTrack({ data: { downloadLocation: p.downloadLocation } }).catch(() => {});
    }
    toast.success("Photo added");
  };
  const onSelectVideo = (_v: StockVideo) => {
    toast.info("Video posting is coming soon — pick an image for now.");
  };

  return (
    <div className="-m-1 max-h-[560px] overflow-y-auto p-1">
      <StockMediaPicker
        initialQuery="social media"
        onSelectPhoto={onSelectPhoto}
        onSelectVideo={onSelectVideo}
        selectLabel="Use in tweet"
      />
    </div>
  );
}

// Explicit export helper — Button is imported to preserve tree-shake friendliness.
export { Button as _KeepButton };
