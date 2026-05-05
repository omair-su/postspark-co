import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getAgencyAnalytics } from "@/lib/agencyAnalytics.functions";
import { Loader2, BarChart3, Building2, Calendar, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/agency-analytics")({
  component: AgencyAnalyticsPage,
});

function AgencyAnalyticsPage() {
  const { session } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    getAgencyAnalytics({ headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(setData)
      .finally(() => setLoading(false));
  }, [session]);

  if (loading) return <Loader2 className="mx-auto mt-20 h-6 w-6 animate-spin text-primary" />;

  if (data?.error === "AGENCY_REQUIRED") {
    return (
      <div className="mx-auto max-w-xl text-center mt-12">
        <h1 className="text-xl font-bold text-foreground">Agency Analytics</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A per-client rollup of generated content, scheduled posts, and approval turnaround. Available on the Agency plan.
        </p>
        <Link to="/dashboard/settings" className="mt-4 inline-block rounded-lg gradient-electric px-4 py-2 text-sm font-semibold text-primary-foreground">
          Upgrade to Agency
        </Link>
      </div>
    );
  }

  const { totals, brands } = data || {};

  return (
    <div className="mx-auto max-w-5xl animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-primary" /> Agency Analytics
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Cross-client overview of activity in your workspace.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Stat icon={<BarChart3 className="h-4 w-4" />} label="Total content" value={totals?.jobs ?? 0} />
        <Stat icon={<Calendar className="h-4 w-4" />} label="Scheduled posts" value={totals?.scheduled ?? 0} />
        <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Approvals" value={totals?.approvals ?? 0} />
        <Stat icon={<Building2 className="h-4 w-4" />} label="Avg. approval (h)" value={totals?.avgApprovalHours ?? 0} />
      </div>

      <h2 className="mt-8 text-sm font-semibold text-foreground">By client / brand</h2>
      <div className="mt-3 rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left">Brand</th>
              <th className="px-4 py-2 text-right">Generated</th>
              <th className="px-4 py-2 text-right">Scheduled</th>
              <th className="px-4 py-2 text-right">Published</th>
            </tr>
          </thead>
          <tbody>
            {(brands || []).length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-xs text-muted-foreground">No client brand kits in this workspace yet.</td></tr>
            )}
            {(brands || []).map((b: any) => (
              <tr key={b.id} className="border-t border-border">
                <td className="px-4 py-3 flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: b.color }} />
                  <span className="text-foreground font-medium">{b.brandName}</span>
                </td>
                <td className="px-4 py-3 text-right text-foreground">{b.jobs}</td>
                <td className="px-4 py-3 text-right text-foreground">{b.scheduled}</td>
                <td className="px-4 py-3 text-right text-foreground">{b.published}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
