import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/import")({
  beforeLoad: () => {
    // Import Studio is now the "Import" tab inside Repurpose. Hint the page to open it.
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("postspark.openTab", "import");
      } catch {}
    }
    throw redirect({ to: "/dashboard/repurpose" });
  },
  component: () => null,
});
