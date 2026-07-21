import { useRef, useState } from "react";
import { UploadCloud, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { extractPaletteFromImage } from "@/lib/colorUtils";

interface Props {
  onExtracted: (hexes: string[]) => void;
}

/**
 * Client-side k-means palette extractor. Drop an image, get 5 dominant colors.
 * No API, no cost.
 */
export function ImagePaletteExtractor({ onExtracted }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [swatches, setSwatches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Drop an image file");
      return;
    }
    setBusy(true);
    try {
      const url = URL.createObjectURL(file);
      setPreview(url);
      const palette = await extractPaletteFromImage(file, 5);
      setSwatches(palette);
      toast.success(`Extracted ${palette.length} dominant colors`);
    } catch (err) {
      console.error(err);
      toast.error("Could not read image");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-xl">
      <div className="mb-3 flex items-center gap-2">
        <Wand2 className="h-3.5 w-3.5 text-violet-400" />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Extract palette from image
        </p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        onClick={() => inputRef.current?.click()}
        className={`relative flex min-h-[128px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition ${
          dragOver
            ? "border-violet-500 bg-violet-500/10"
            : "border-slate-700 bg-slate-950/60 hover:border-violet-500/60"
        }`}
      >
        {preview ? (
          <img src={preview} alt="" className="max-h-24 rounded-md object-contain" />
        ) : (
          <>
            <UploadCloud className={`h-6 w-6 ${dragOver ? "text-violet-300" : "text-slate-500"}`} />
            <p className="text-xs text-slate-400">
              Drop a logo or reference image, or <span className="text-violet-300">browse</span>
            </p>
          </>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-950/80 backdrop-blur-sm">
            <Loader2 className="h-5 w-5 animate-spin text-violet-300" />
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>

      {swatches.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Extracted swatches — click to add
          </p>
          <div className="flex flex-wrap gap-2">
            {swatches.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => onExtracted([hex])}
                className="group flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-950/60 py-1 pl-1 pr-2.5 transition hover:border-violet-500/60"
              >
                <span className="h-5 w-5 rounded-full border border-slate-800" style={{ background: hex }} />
                <span className="font-mono text-[10px] uppercase text-slate-300 group-hover:text-white">
                  {hex}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => onExtracted(swatches)}
              className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white transition hover:opacity-90"
            >
              Save all to swatches
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
