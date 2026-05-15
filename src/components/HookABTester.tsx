import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Loader2, Check, Copy, Trophy } from "lucide-react";
import { generateJobHookVariants, setWinningHook } from "@/lib/abHooks.functions";
import { notify } from "@/lib/notify";

type Variant = { style: string; text: string; rationale: string };

interface Props {
  inputText: string;
  jobId: string | null;
}

const PLATFORMS = [
  { id: "twitter", label: "X / Twitter" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
] as const;

export function HookABTester({ inputText, jobId }: Props) {
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]["id"]>("twitter");
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [winner, setWinner] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const generate = useServerFn(generateJobHookVariants);
  const setWin = useServerFn(setWinningHook);

  const handleGenerate = async () => {
    setLoading(true);
    setVariants([]);
    setWinner(null);
    try {
      const res = await generate({
        data: { jobId: jobId || undefined, inputText, platform },
      });
      if (res.error) {
        notify.error(res.error, { key: "ab-hook-err" });
      } else {
        setVariants(res.variants);
      }
    } catch {
      notify.error("Couldn't generate variants.", { key: "ab-hook-err" });
    } finally {
      setLoading(false);
    }
  };

  const pickWinner = async (i: number) => {
    setWinner(i);
    if (jobId) {
      try {
        await setWin({ data: { jobId, index: i } });
        notify.success("Winner saved 🏆", { key: "ab-hook-win" });
      } catch {}
    }
  };

  const copy = async (text: string, i: number) => {
    await navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" /> A/B Hook Variants
            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">PRO</span>
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Generate 3 different opening hooks, test which one performs best.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-0.5">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPlatform(p.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                platform === p.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || !inputText.trim()}
        className="mt-4 inline-flex items-center gap-2 rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {variants.length ? "Regenerate variants" : "Generate 3 variants"}
      </button>

      {variants.length > 0 && (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {variants.map((v, i) => {
            const isWinner = winner === i;
            return (
              <div
                key={i}
                className={`relative rounded-lg border p-3 transition-all ${
                  isWinner
                    ? "border-primary bg-primary/5 shadow-[0_0_0_2px_rgba(124,58,237,0.15)]"
                    : "border-border bg-background hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-primary">{v.style}</span>
                  {isWinner && <Trophy className="h-3.5 w-3.5 text-primary" />}
                </div>
                <p className="mt-2 text-sm text-foreground leading-snug whitespace-pre-wrap">{v.text}</p>
                <p className="mt-2 text-[11px] italic text-muted-foreground">{v.rationale}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => copy(v.text, i)}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    {copied === i ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                    {copied === i ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={() => pickWinner(i)}
                    className={`flex-1 inline-flex items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                      isWinner
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-foreground hover:bg-primary/10"
                    }`}
                  >
                    <Trophy className="h-3 w-3" /> {isWinner ? "Winner" : "Pick"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
