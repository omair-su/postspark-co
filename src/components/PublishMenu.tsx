import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Send, ChevronDown, CalendarClock, Rocket } from "lucide-react";
import { BrandGlyph, type BrandKey } from "@/components/BrandIcon";

interface Props {
  content: string;
  formatId: string;
}

/** Repurpose format → native publishing platform. */
const PLATFORM_FOR_FORMAT: Record<string, BrandKey[]> = {
  tweets: ["x"],
  thread: ["threads", "x"],
  linkedin: ["linkedin"],
  instagram: ["instagram"],
  facebook: ["facebook"],
  tiktok: ["tiktok"],
};

export const PUBLISH_HANDOFF_KEY = "postspark.publish.draft";

export function PublishMenu({ content, formatId }: Props) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const text = content.trim();
  const platforms = PLATFORM_FOR_FORMAT[formatId] ?? [];

  const handoff = (platform: BrandKey | null, target: "publishing" | "calendar") => {
    try {
      sessionStorage.setItem(
        PUBLISH_HANDOFF_KEY,
        JSON.stringify({ text, platform, formatId, at: Date.now() }),
      );
    } catch {}
    setOpen(false);
    navigate({ to: target === "publishing" ? "/dashboard/publishing" : "/dashboard/calendar" });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-lg gradient-electric px-2.5 py-1 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Send className="h-3 w-3" /> Publish <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-64 rounded-xl border border-border bg-card p-1 shadow-lg">
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Publish from PostSpark
            </div>
            {platforms.map((p) => (
              <button
                key={p}
                onClick={() => handoff(p, "publishing")}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-foreground hover:bg-muted"
              >
                <BrandGlyph brand={p} size={14} />
                <span className="font-medium capitalize">
                  {p === "x" ? "Post to X" : `Post to ${p}`}
                </span>
              </button>
            ))}
            <button
              onClick={() => handoff(platforms[0] ?? null, "publishing")}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-foreground hover:bg-muted"
            >
              <Rocket className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">Open Publishing Center</span>
            </button>
            <button
              onClick={() => handoff(platforms[0] ?? null, "calendar")}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-foreground hover:bg-muted"
            >
              <CalendarClock className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">Schedule in Calendar</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
