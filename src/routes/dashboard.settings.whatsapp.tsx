import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getWhatsAppPrefs,
  saveWhatsAppPrefs,
  connectWhatsApp,
  disconnectWhatsApp,
  testWhatsApp,
  listWhatsAppNotifications,
} from "@/lib/whatsapp.functions";
import { toast } from "sonner";
import {
  MessageCircle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Send,
  Trash2,
  Bell,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/settings/whatsapp")({
  head: () => ({
    meta: [
      { title: "WhatsApp Notifications — PostSpark" },
      {
        name: "description",
        content:
          "Get instant WhatsApp updates when PostSpark publishes, schedules, or needs your approval.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: WhatsAppSettings,
});

type Prefs = {
  whatsapp_phone: string | null;
  whatsapp_connected_at: string | null;
  post_published: boolean;
  post_failed: boolean;
  scheduled_reminder: boolean;
  approval_request: boolean;
  account_connected: boolean;
  subscription: boolean;
};

const TOGGLES: { key: keyof Prefs; label: string; desc: string }[] = [
  { key: "post_published", label: "Post published", desc: "When a scheduled post goes live." },
  { key: "post_failed", label: "Post failed", desc: "If a publish attempt fails or is rejected." },
  {
    key: "scheduled_reminder",
    label: "Scheduled reminder",
    desc: "1 hour before a scheduled post publishes.",
  },
  {
    key: "approval_request",
    label: "Content approval",
    desc: "When a client approval request arrives.",
  },
  { key: "account_connected", label: "Account connected", desc: "New social channel connected." },
  { key: "subscription", label: "Subscription", desc: "Billing / plan updates." },
];

function WhatsAppSettings() {
  const { session } = useAuth();
  const authHeaders = session
    ? { headers: { Authorization: `Bearer ${session.access_token}` } }
    : ({} as any);

  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notifs, setNotifs] = useState<any[]>([]);

  const refresh = async () => {
    setLoading(true);
    const [p, n] = await Promise.all([
      getWhatsAppPrefs(authHeaders),
      listWhatsAppNotifications(authHeaders),
    ]);
    setPrefs((p as any).prefs as Prefs | null);
    setNotifs((n as any).notifications || []);
    setLoading(false);
  };

  useEffect(() => {
    if (session) refresh();
  }, [session]);

  const connected = !!prefs?.whatsapp_phone;

  const handleConnect = async () => {
    if (!phone.trim()) return toast.error("Enter your WhatsApp number");
    setBusy("connect");
    try {
      const res = await connectWhatsApp({ data: { phone }, ...authHeaders } as any);
      if (!(res as any).success)
        toast.error((res as any).error || "Could not connect WhatsApp");
      else {
        toast.success("WhatsApp connected — check your phone");
        setPhone("");
        refresh();
      }
    } finally {
      setBusy(null);
    }
  };

  const handleDisconnect = async () => {
    setBusy("disc");
    try {
      await disconnectWhatsApp(authHeaders);
      toast.success("WhatsApp disconnected");
      refresh();
    } finally {
      setBusy(null);
    }
  };

  const handleTest = async () => {
    setBusy("test");
    try {
      const res = await testWhatsApp(authHeaders);
      if ((res as any).success) toast.success("Test message sent");
      else toast.error((res as any).error || "Send failed");
      refresh();
    } finally {
      setBusy(null);
    }
  };

  const toggle = async (key: keyof Prefs) => {
    if (!prefs) return;
    const next = !(prefs as any)[key];
    setPrefs({ ...prefs, [key]: next } as Prefs);
    const res = await saveWhatsAppPrefs({ data: { [key]: next }, ...authHeaders } as any);
    if (!(res as any).success) {
      toast.error("Could not save");
      refresh();
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6 flex items-start gap-3">
        <div className="rounded-lg bg-green-500/10 p-2 text-green-600">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">WhatsApp Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Get instant updates about your posts, schedules, and approvals — straight to WhatsApp.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (
        <>
          {/* Connection card */}
          <section className="rounded-xl border border-border bg-card p-5">
            {connected ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Connected</div>
                    <div className="text-sm text-muted-foreground">
                      +{prefs!.whatsapp_phone}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleTest}
                    disabled={busy === "test"}
                    className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent disabled:opacity-50 flex items-center gap-2"
                  >
                    {busy === "test" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send test
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={busy === "disc"}
                    className="rounded-lg border border-destructive/40 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" /> Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  WhatsApp phone number (with country code)
                </label>
                <div className="flex gap-2">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555 123 4567"
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <button
                    onClick={handleConnect}
                    disabled={busy === "connect"}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                  >
                    {busy === "connect" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MessageCircle className="h-4 w-4" />
                    )}
                    Connect
                  </button>
                </div>
                <p className="flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  We'll send a confirmation message. Message &amp; data rates may apply.
                </p>
              </div>
            )}
          </section>

          {/* Preferences */}
          <section className="mt-6 rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-medium">Notification preferences</h2>
            </div>
            <div className="grid gap-3">
              {TOGGLES.map((t) => {
                const value = prefs ? ((prefs as any)[t.key] as boolean) : true;
                return (
                  <label
                    key={t.key}
                    className={`flex items-start justify-between gap-4 rounded-lg border border-border p-3 ${
                      !connected ? "opacity-60" : ""
                    }`}
                  >
                    <div>
                      <div className="text-sm font-medium">{t.label}</div>
                      <div className="text-xs text-muted-foreground">{t.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!value}
                      disabled={!connected}
                      onChange={() => toggle(t.key)}
                      className="mt-1 h-4 w-4"
                    />
                  </label>
                );
              })}
            </div>
          </section>

          {/* Notification center */}
          <section className="mt-6 rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-medium">Recent notifications</h2>
              <span className="text-xs text-muted-foreground">{notifs.length} messages</span>
            </div>
            {notifs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {notifs.map((n) => (
                  <li key={n.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div>
                      <div className="font-medium capitalize">
                        {String(n.event_type).replace(/_/g, " ")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(n.created_at).toLocaleString()} · to +{n.recipient}
                      </div>
                      {n.error_message ? (
                        <div className="text-xs text-destructive mt-1">{n.error_message}</div>
                      ) : null}
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        n.status === "sent"
                          ? "bg-green-500/10 text-green-600"
                          : n.status === "failed" || n.status === "bounced"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {n.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
