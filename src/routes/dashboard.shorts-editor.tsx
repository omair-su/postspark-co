import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Film } from "lucide-react";
import { TimelineEditor } from "@/components/shorts/TimelineEditor";

export const Route = createFileRoute("/dashboard/shorts-editor")({
  component: ShortsEditorPage,
});

function ShortsEditorPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-6 pb-20 pt-6 space-y-6">
      <Link to="/dashboard/shorts-studio" className="inline-flex items-center gap-1.5 text-[12px] text-[#6B7280] hover:text-[#7C3AED]">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Shorts Studio
      </Link>

      <div className="flex items-start gap-4 rounded-2xl p-5"
        style={{ background: "linear-gradient(135deg, #161F33 0%, rgba(124,58,237,0.14) 100%)", border: "1px solid #243047" }}>
        <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px]"
          style={{ background: "linear-gradient(135deg, #EC4899 0%, #7C3AED 100%)", boxShadow: "0 2px 8px rgba(124,58,237,0.25)" }}>
          <Film className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="m-0 text-[22px] font-bold tracking-tight text-white">Shorts Editor</h1>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 border border-emerald-400/30">Beta</span>
          </div>
          <p className="m-0 mt-1 text-[13px] leading-relaxed text-white/70">
            Multi-track timeline editor: up to 8 clips, drag-reorder, trim handles, captions, music + voiceover. Autosave drafts. Export WebM in-browser. Stock B-roll clips are silent — add music or a VO track for audio.
          </p>
        </div>
      </div>

      <TimelineEditor />
    </div>
  );
}
