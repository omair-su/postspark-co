import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/import")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/repurpose" });
  },
  component: () => null,
});
