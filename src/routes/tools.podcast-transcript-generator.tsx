import { createFileRoute } from "@tanstack/react-router";
import { SegmentPage, segmentHead } from "@/components/segment/SegmentPage";

export const Route = createFileRoute("/tools/podcast-transcript-generator")({
  head: () => segmentHead({
    title: "Podcast Transcript Generator with Speakers — Free | PostSpark",
    desc: "Upload your podcast or paste a YouTube link. Get Whisper-quality transcript with speaker diarization, episode chapters, and pull-quote blocks — free tier included.",
    url: "https://postspark.co/tools/podcast-transcript-generator",
    path: "/tools/podcast-transcript-generator"
  }),
  component: () => (
    <SegmentPage
      path="/tools/podcast-transcript-generator"
      eyebrow="Free Tool · Podcast Transcript Generator"
      h1="Podcast transcripts with speakers, chapters, and pull-quotes — done."
      sub="OpenAI Whisper handles the transcription. AssemblyAI labels each speaker. PostSpark adds timestamped chapters and pull-quote blocks ready for your show notes."
      pains={[
        "Otter.ai gives you the transcript — then you still write show notes manually.",
        "Manual speaker labeling for a 60-min interview takes 90 minutes.",
        "No chapters, no pull-quotes, no ready-to-publish assets.",
      ]}
      solutions={[
        "Whisper + AssemblyAI diarization — accurate transcripts with 'Speaker A / Speaker B' labels you can rename.",
        "Auto-generated chapters with timestamps + a pull-quote per chapter, ready to copy.",
        "One-click: turn the transcript into tweets, LinkedIn carousel, and a newsletter draft.",
      ]}
      workflow={[
        { title: "Upload audio or paste YouTube link", body: "MP3, MP4, M4A, or any YouTube/Spotify episode URL." },
        { title: "Whisper transcribes + speakers labeled", body: "Rename Speaker A → 'Host', Speaker B → guest name." },
        { title: "Get chapters, pull-quotes, and repurposed posts", body: "Ready to publish on web and social." },
      ]}
    />
  ),
});
