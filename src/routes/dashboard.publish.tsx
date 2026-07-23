import { createFileRoute, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { Twitter } from "lucide-react";
import { XComposer } from "@/components/publish/XComposer";
import { XAnalyticsCard } from "@/components/publish/XAnalyticsCard";

const searchSchema = z.object({
  text: z.string().optional(),
  media: z.string().optional(), // comma-separated URLs
  repurposeJobId: z.string().uuid().optional(),
});

export const Route = createFileRoute("/dashboard/publish")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Publishing Center — PostSpark" },
      {
        name: "description",
        content: "Compose, preview, and schedule tweets directly from PostSpark with images and link-in-reply threads.",
      },
      { property: "og:title", content: "Publishing Center — PostSpark" },
      {
        property: "og:description",
        content: "Compose, preview, and schedule tweets directly from PostSpark.",
      },
    ],
  }),
  component: PublishPage,
});

function PublishPage() {
  const search = useSearch({ from: "/dashboard/publish" });
  const initialMedia = (search.media || "")
    .split(",")
    .map((s: string) => s.trim())
    .filter((s: string) => /^https?:\/\//.test(s));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Twitter className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Publishing Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Post to X directly from PostSpark. Attach images from Image Studio, Stock Gallery, or your device — with a
            live preview and smart link-in-reply threads.
          </p>
        </div>
      </header>

      <XComposer
        initialText={search.text || ""}
        initialMedia={initialMedia}
        repurposeJobId={search.repurposeJobId}
      />
    </div>
  );
}
