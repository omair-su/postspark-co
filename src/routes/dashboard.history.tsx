import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, FileText } from "lucide-react";

interface Job {
  id: string;
  created_at: string;
  input_text: string;
  outputs: Record<string, string>;
}

export const Route = createFileRoute("/dashboard/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selected, setSelected] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("repurpose_jobs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setJobs((data as Job[]) || []);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (selected) {
    return (
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => setSelected(null)}
          className="mb-4 text-sm font-medium text-primary hover:underline"
        >
          ← Back to History
        </button>
        <h1 className="text-xl font-bold text-foreground">Repurpose Details</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Created {new Date(selected.created_at).toLocaleString()}
        </p>

        <div className="mt-4 rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Input</h2>
          <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{selected.input_text}</p>
        </div>

        {selected.outputs &&
          Object.entries(selected.outputs).map(([key, val]) => (
            <div key={key} className="mt-4 rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold text-foreground capitalize">{key}</h2>
              <pre className="mt-2 whitespace-pre-wrap text-sm text-foreground leading-relaxed">{val}</pre>
            </div>
          ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-foreground">My History</h1>
      <p className="mt-1 text-sm text-muted-foreground">View all your past repurposes.</p>

      {jobs.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-card p-10 text-center">
          <Clock className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">No repurposes yet. Create your first one!</p>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {jobs.map((job) => {
            const formats = job.outputs ? Object.keys(job.outputs) : [];
            return (
              <button
                key={job.id}
                onClick={() => setSelected(job)}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-accent"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm text-foreground">
                    {job.input_text.slice(0, 50)}...
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span className="text-xs text-muted-foreground">
                    {formats.length} format{formats.length !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(job.created_at).toLocaleDateString()}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
