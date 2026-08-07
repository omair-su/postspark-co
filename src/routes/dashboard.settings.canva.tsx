import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import {
  CanvaConnectionCard,
  CanvaSetupGuide,
  useCanvaStatus,
} from "@/components/canva/CanvaConnect";

export const Route = createFileRoute("/dashboard/settings/canva")({
  head: () => ({
    meta: [
      { title: "Canva connection — PostSpark" },
      {
        name: "description",
        content: "Connect your Canva account to design thumbnails, covers and carousels inside PostSpark.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CanvaSettings,
});

function CanvaSettings() {
  const { status, loading, refresh } = useCanvaStatus();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("canva");
    if (s === "connected") toast.success("Canva connected");
    else if (s?.startsWith("error:")) toast.error(`Canva connect failed: ${decodeURIComponent(s.slice(6))}`);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Canva</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Design with your own Canva templates, fonts and brand assets — then export straight into PostSpark.
        </p>
      </div>

      <CanvaConnectionCard status={status} loading={loading} onChanged={refresh} />
      <CanvaSetupGuide />
    </div>
  );
}
