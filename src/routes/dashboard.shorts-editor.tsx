import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Film } from "lucide-react";
import { LiteEditor } from "@/components/shorts/LiteEditor";

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
        style={{ background: "linear-gradient(135deg, #FAFAF8 0%, #F3F0FF 100%)", border: "0.5px solid rgba(107,78,255,0.12)" }}>
        <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px]"
          style={{ background: "linear-gradient(135deg, #EC4899 0%, #7C3AED 100%)", boxShadow: "0 2px 8px rgba(124,58,237,0.25)" }}>
          <Film className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="m-0 text-[22px] font-bold tracking-tight text-[#1A1A2E]">Shorts Editor</h1>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 border border-emerald-200">Beta</span>
          </div>
          <p className="m-0 mt-1 text-[13px] leading-relaxed text-[#6B7280]">
            Drag-drop up to 5 clips, trim, crop to 9:16, burn captions, mix in music + voiceover, and export a finished WebM — all in your browser. No CapCut, no install.
          </p>
        </div>
      </div>

      <LiteEditor />
    </div>
  );
}
