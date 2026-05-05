import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchApprovalByToken, submitApprovalResponse } from "@/lib/approvals.functions";
import { Loader2, Check, MessageSquareWarning, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/review/$token")({
  head: () => ({ meta: [{ title: "Content review — PostSpark" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: ReviewPage,
});

function ReviewPage() {
  const { token } = Route.useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [decision, setDecision] = useState<"approved" | "changes_requested" | null>(null);

  const refresh = () => {
    fetchApprovalByToken({ data: { token } })
      .then((r) => setData(r.approval))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [token]);

  const submit = async (status: "approved" | "changes_requested") => {
    setBusy(true);
    const res = await submitApprovalResponse({
      data: { token, status, clientName: name || undefined, clientComment: comment || undefined },
    });
    setBusy(false);
    if (!(res as any).success) {
      toast.error((res as any).error || "Could not submit");
      return;
    }
    setDecision(status);
    refresh();
  };

  if (loading) {
    return <Loader2 className="mx-auto mt-20 h-6 w-6 animate-spin text-primary" />;
  }
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">This review link is invalid or has expired.</p>
      </div>
    );
  }

  const job = data.job || {};
  const outputs = (job.outputs as any) || {};
  const raw = outputs.raw || JSON.stringify(outputs, null, 2);
  const isWhiteLabel = data.workspace_white_label === true;
  const isDecided = data.status !== "pending";

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Review request</p>
            <h1 className="text-lg font-bold text-foreground">{job.title || "Content for your review"}</h1>
          </div>
          {!isWhiteLabel && (
            <span className="text-[11px] text-muted-foreground">Powered by PostSpark</span>
          )}
          {isWhiteLabel && data.workspace_name && (
            <span className="text-[11px] text-muted-foreground">{data.workspace_name}</span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Original brief</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{job.input_text}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Generated content</p>
          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">{raw}</pre>
        </div>

        {isDecided ? (
          <div className={`rounded-xl border p-5 ${data.status === "approved" ? "border-primary/30 bg-primary/5" : "border-amber-500/30 bg-amber-500/5"}`}>
            <p className="text-sm font-semibold text-foreground">
              {data.status === "approved" ? "✓ Approved" : "⚠ Changes requested"}
              {data.client_name ? ` by ${data.client_name}` : ""}
            </p>
            {data.client_comment && (
              <p className="mt-2 text-sm text-muted-foreground italic">"{data.client_comment}"</p>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm font-semibold text-foreground mb-3">Your response</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground mb-2"
            />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comments or requested changes (optional)"
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={() => submit("approved")}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg gradient-electric px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                <ThumbsUp className="h-4 w-4" /> Approve
              </button>
              <button
                onClick={() => submit("changes_requested")}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-50"
              >
                <MessageSquareWarning className="h-4 w-4" /> Request changes
              </button>
            </div>
          </div>
        )}
        {decision && (
          <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Check className="h-3 w-3 text-primary" /> Response submitted
          </p>
        )}
      </main>
    </div>
  );
}
