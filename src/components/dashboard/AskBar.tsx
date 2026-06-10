import { useState, type KeyboardEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sparkles, ArrowRight, Flame, Image as ImageIcon, FileText, Layers, Repeat } from "lucide-react";

type SuggestionId = "repurpose" | "hook" | "image" | "seo" | "carousel";

const SUGGESTIONS: Array<{ id: SuggestionId; label: string; icon: any; to: string; accent: string }> = [
  { id: "repurpose", label: "Repurpose a post", icon: Repeat, to: "/dashboard/repurpose", accent: "repurpose" },
  { id: "hook", label: "Write 10 hooks", icon: Flame, to: "/dashboard/hook-lab", accent: "hook" },
  { id: "image", label: "Generate an image", icon: ImageIcon, to: "/dashboard/image-studio", accent: "image" },
  { id: "seo", label: "Write an SEO blog", icon: FileText, to: "/dashboard/seo-blog", accent: "seo" },
  { id: "carousel", label: "Build a carousel", icon: Layers, to: "/dashboard/carousel", accent: "carousel" },
];

/**
 * Hero command input on the dashboard home.
 * Routes the user to the right tool based on free-text intent + suggestion chips.
 */
export function AskBar() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");

  function detectRoute(v: string): { to: string; search?: any } {
    const t = v.toLowerCase();
    if (/hook|headline|opener/.test(t)) return { to: "/dashboard/hook-lab" };
    if (/image|thumbnail|cover|picture|photo/.test(t)) return { to: "/dashboard/image-studio" };
    if (/carousel|slides?/.test(t)) return { to: "/dashboard/carousel" };
    if (/seo|blog|article/.test(t)) return { to: "/dashboard/seo-blog" };
    if (/humaniz/.test(t)) return { to: "/dashboard/humanizer" };
    if (/podcast|audio/.test(t)) return { to: "/dashboard/podcast" };
    if (/repl(y|ies)/.test(t)) return { to: "/dashboard/reply-generator" };
    return { to: "/dashboard/repurpose" };
  }

  function submit() {
    const v = value.trim();
    if (!v) {
      navigate({ to: "/dashboard/repurpose" });
      return;
    }
    const r = detectRoute(v);
    try { sessionStorage.setItem("ps:askbar:prefill", v); } catch {}
    navigate(r);
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") submit();
  }

  return (
    <div className="ds-fade-up-1">
      <label className="ds-askbar" htmlFor="ds-askbar">
        <Sparkles className="h-4 w-4 shrink-0 text-[#c4b5fd]" />
        <input
          id="ds-askbar"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          placeholder="What do you want to create today? e.g. Repurpose my latest blog into a LinkedIn post…"
          aria-label="Ask PostSpark"
        />
        <button
          type="button"
          onClick={submit}
          className="ds-cta-pill !py-2 !px-4 text-[13px]"
          aria-label="Run"
        >
          Run <ArrowRight className="h-4 w-4" />
        </button>
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            data-accent={s.accent}
            onClick={() => navigate({ to: s.to })}
            className="ds-chip hover:border-[#a78bfa]/55 hover:bg-white/10 transition-colors"
          >
            <s.icon className="h-3 w-3 text-[#c4b5fd]" />
            <span>{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
