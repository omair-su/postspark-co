import { createFileRoute } from "@tanstack/react-router";
import { StockMediaPicker } from "@/components/stock/StockMediaPicker";
import { Images } from "lucide-react";

export const Route = createFileRoute("/dashboard/stock-gallery")({
  head: () => ({
    meta: [
      { title: "Stock Gallery — Free Photos & Videos | PostSpark" },
      {
        name: "description",
        content:
          "Search millions of free premium photos from Unsplash and videos from Pexels — attribution handled automatically for every download.",
      },
    ],
  }),
  component: StockGalleryPage,
});

function StockGalleryPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6 flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Images className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Stock Gallery</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Millions of free premium photos from{" "}
            <a
              href="https://unsplash.com/?utm_source=postspark&utm_medium=referral"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="underline"
            >
              Unsplash
            </a>{" "}
            and videos from{" "}
            <a
              href="https://www.pexels.com"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="underline"
            >
              Pexels
            </a>
            . Photographer credit is displayed on every asset and downloads are
            tracked automatically to comply with each provider's guidelines.
          </p>
        </div>
      </header>

      <StockMediaPicker initialQuery="entrepreneur" selectLabel="Copy URL" />
    </div>
  );
}
