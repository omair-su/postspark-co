import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Film } from "lucide-react";
import { TimelineEditor } from "@/components/shorts/TimelineEditor";
import { HeroArt } from "@/components/dashboard/HeroArt";

export const Route = createFileRoute("/dashboard/shorts-editor")({
  component: ShortsEditorPage,
});

function ShortsEditorPage() {
  return (
    <div className="shorts-workbench mx-auto max-w-[1280px] px-4 pb-20 pt-4 sm:px-6 sm:pt-6 space-y-6">
      <Link to="/dashboard/shorts-studio" className="inline-flex items-center gap-1.5 text-[12px] text-[#A78BFA] hover:text-white">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Shorts Studio
      </Link>

      <div className="shorts-hero flex items-start gap-4 rounded-2xl p-5 sm:p-6">
        <HeroArt art="shorts" />
        <div className="shorts-hero-icon flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px]">
          <Film className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="m-0 text-[26px] font-bold tracking-tight text-white sm:text-[32px]">Shorts Editor</h1>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 border border-emerald-400/30">Beta</span>
          </div>
          <p className="m-0 mt-1 text-[13px] leading-relaxed text-white/70">
            Premium multi-track vertical editor with drag-trim clips, synced audio, ElevenLabs voiceover, Deepgram captions, SRT export, and FFmpeg browser export.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-5">
            {['Video track', 'Music track', 'VO track', 'Caption blocks', 'Burned MP4'].map((label) => (
              <span key={label} className="shorts-signal-chip">{label}</span>
            ))}
          </div>
        </div>
      </div>

      <TimelineEditor />
    </div>
  );
}
