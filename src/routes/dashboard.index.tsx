import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Repeat, Sparkles, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const { user } = useAuth();
  const [usageCount, setUsageCount] = useState(0);
  const [recentJobs, setRecentJobs] = useState<Array<{ id: string; created_at: string; input_text: string }>>([]);

  useEffect(() => {
    if (!user) return;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    (supabase as any)
      .from("repurpose_jobs")
      .select("id, created_at, input_text")
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth.toISOString())
      .order("created_at", { ascending: false })
      .then(({ data }: { data: any }) => {
        if (data) {
          setUsageCount(data.length);
          setRecentJobs(data.slice(0, 5));
        }
      });
  }, [user]);

  const name = user?.user_metadata?.full_name || "there";

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-foreground">Welcome back, {name}!</h1>
      <p className="mt-1 text-sm text-muted-foreground">Here's your content repurposing overview.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-electric">
              <Repeat className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{usageCount}</p>
              <p className="text-xs text-muted-foreground">Repurposes this month</p>
            </div>
          </div>
        </div>

        <Link
          to="/dashboard/repurpose"
          className="flex items-center gap-3 rounded-xl border border-primary/30 bg-card p-5 transition-all hover:border-primary hover:shadow-md"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-electric">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">New Repurpose</p>
            <p className="text-xs text-muted-foreground">Create content now</p>
          </div>
        </Link>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
        {recentJobs.length === 0 ? (
          <div className="mt-4 rounded-xl border border-border bg-card p-8 text-center">
            <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No repurposes yet. Create your first one!</p>
            <Link
              to="/dashboard/repurpose"
              className="mt-4 inline-flex items-center gap-2 rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <Sparkles className="h-3.5 w-3.5" /> Get Started
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {recentJobs.map((job) => (
              <Link
                key={job.id}
                to="/dashboard/history"
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent"
              >
                <p className="truncate text-sm text-foreground max-w-xs">
                  {job.input_text.slice(0, 50)}...
                </p>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                  {new Date(job.created_at).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
