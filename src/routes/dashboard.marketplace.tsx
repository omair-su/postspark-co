import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Store, ShoppingBag, Coins, CreditCard, Tag, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState, ErrorState, SkeletonTiles } from "@/components/dashboard/StateViews";
import { useAuth } from "@/hooks/useAuth";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import {
  buyListingWithCredits,
  createListing,
  listMarketplace,
  listSellablePacks,
  unlistListing,
} from "@/lib/packMarketplace.functions";
import {
  CREDIT_PRICE_OPTIONS,
  MAX_LISTING_DESCRIPTION,
  MAX_LISTING_TITLE,
  PACK_TIERS,
  tierForPriceId,
  type ListingSummary,
} from "@/lib/marketplace";

export const Route = createFileRoute("/dashboard/marketplace")({
  head: () => ({
    meta: [
      { title: "Pack Marketplace — PostSpark" },
      {
        name: "description",
        content:
          "Browse ready-to-publish PostSpark content packs, buy them with a card or credits, and list your own packs for sale.",
      },
      { property: "og:title", content: "Pack Marketplace — PostSpark" },
      {
        property: "og:description",
        content: "Buy and sell ready-to-publish content packs inside PostSpark.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MarketplacePage,
});

type Tab = "browse" | "mine";

function MarketplacePage() {
  const { user, session } = useAuth();
  const { openCheckout, loading: checkoutLoading } = usePaddleCheckout();

  const [tab, setTab] = useState<Tab>("browse");
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(
    async (which: Tab) => {
      setLoading(true);
      setError(null);
      try {
        const rows = await listMarketplace({ data: { mine: which === "mine" } });
        setListings(rows);
      } catch (e: any) {
        setError(e?.message || "We couldn't load the marketplace.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (session) void load(tab);
  }, [session, tab, load]);

  const buyWithCredits = async (listing: ListingSummary) => {
    setBusyId(listing.id);
    try {
      const res = await buyListingWithCredits({ data: { listingId: listing.id } });
      if (!res.success) {
        if (res.error === "NOT_ENOUGH_CREDITS") {
          toast.error("Not enough credits. Top up from Billing and try again.");
        } else {
          toast.error(res.error || "The purchase didn't go through.");
        }
        return;
      }
      toast.success("Pack added to your library.");
      void load(tab);
    } catch (e: any) {
      toast.error(e?.message || "The purchase didn't go through.");
    } finally {
      setBusyId(null);
    }
  };

  const buyWithCard = async (listing: ListingSummary) => {
    if (!listing.priceId || !user) return;
    setBusyId(listing.id);
    await openCheckout({
      priceId: listing.priceId,
      userId: user.id,
      customerEmail: user.email ?? undefined,
      customData: { listingId: listing.id },
      successUrl: `${window.location.origin}/dashboard/marketplace?purchase=success`,
      meta: { surface: "marketplace" },
    });
    setBusyId(null);
  };

  const unlist = async (listing: ListingSummary) => {
    setBusyId(listing.id);
    try {
      const res = await unlistListing({ data: { listingId: listing.id } });
      if (res.success) {
        toast.success("Listing removed from the marketplace.");
        void load(tab);
      }
    } catch (e: any) {
      toast.error(e?.message || "We couldn't remove that listing.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <PageHeader
        eyebrow="Marketplace"
        title="Pack Marketplace"
        subtitle="Buy ready-to-publish content packs with a card or your credits — or list your own packs for sale."
        icon={<Store className="h-5 w-5" />}
        actions={
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Tag className="h-4 w-4" /> Sell a pack
          </button>
        }
      />

      <div className="flex gap-2">
        {(["browse", "mine"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              tab === t
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "browse" ? "Browse packs" : "My listings"}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonTiles />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load(tab)} />
      ) : listings.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-5 w-5" />}
          title={tab === "mine" ? "You haven't listed a pack yet" : "No packs on sale yet"}
          body={
            tab === "mine"
              ? "Turn a pack you already made into a product — set a card price, a credit price, or both."
              : "Packs listed by creators show up here. Check back soon, or list one of your own."
          }
          action={
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              <Tag className="h-4 w-4" /> Sell a pack
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => {
            const tier = tierForPriceId(listing.priceId);
            const busy = busyId === listing.id || checkoutLoading;
            return (
              <article
                key={listing.id}
                className="flex flex-col rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="min-w-0 text-sm font-semibold text-foreground">{listing.title}</h3>
                  <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {listing.pieceCount} posts
                  </span>
                </div>
                {listing.description ? (
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {listing.description}
                  </p>
                ) : null}
                {listing.previewText ? (
                  <p className="mt-3 line-clamp-4 rounded-lg bg-muted/50 p-3 text-[11px] leading-relaxed text-muted-foreground">
                    {listing.previewText}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                  {listing.platforms.slice(0, 4).map((p) => (
                    <span key={p} className="rounded-full bg-muted px-2 py-0.5 font-medium">
                      {p}
                    </span>
                  ))}
                  {listing.salesCount > 0 ? <span>· {listing.salesCount} sold</span> : null}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                  {listing.owned ? (
                    <Link
                      to="/dashboard/history"
                      className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> In your library
                    </Link>
                  ) : listing.isMine ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void unlist(listing)}
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" /> Remove listing
                    </button>
                  ) : (
                    <>
                      {tier ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void buyWithCard(listing)}
                          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                        >
                          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
                          Buy {tier.label}
                        </button>
                      ) : null}
                      {listing.creditPrice ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void buyWithCredits(listing)}
                          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary/50 hover:text-primary disabled:opacity-50"
                        >
                          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Coins className="h-3.5 w-3.5" />}
                          {listing.creditPrice} credits
                        </button>
                      ) : null}
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {showForm ? (
        <SellPackDialog
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            setTab("mine");
            void load("mine");
          }}
        />
      ) : null}
    </div>
  );
}

function SellPackDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [packs, setPacks] = useState<{ id: string; title: string; pieceCount: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobId, setJobId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceId, setPriceId] = useState<string>("pack_price_19");
  const [creditPrice, setCreditPrice] = useState<number>(25);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const rows = await listSellablePacks({ data: undefined as never });
        setPacks(rows);
        if (rows[0]) {
          setJobId(rows[0].id);
          setTitle(rows[0].title.slice(0, MAX_LISTING_TITLE));
        }
      } catch {
        toast.error("We couldn't load your packs.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const submit = async () => {
    if (!jobId || title.trim().length < 3) {
      toast.error("Pick a pack and give it a title.");
      return;
    }
    setSaving(true);
    try {
      const res = await createListing({
        data: {
          jobId,
          title: title.trim(),
          description: description.trim() || undefined,
          priceId: priceId || null,
          creditPrice: creditPrice || null,
        },
      });
      if (!res.success) {
        toast.error(res.error || "We couldn't create that listing.");
        return;
      }
      toast.success("Your pack is live in the marketplace.");
      onCreated();
    } catch (e: any) {
      toast.error(e?.message || "We couldn't create that listing.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-0 backdrop-blur sm:items-center sm:p-6">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-card p-5 sm:rounded-2xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground">Sell a pack</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your packs…
          </div>
        ) : packs.length === 0 ? (
          <EmptyState
            className="mt-5"
            icon={<Sparkles className="h-5 w-5" />}
            title="No packs to sell yet"
            body="Create a pack in Repurpose Studio first, then come back to list it."
            action={
              <Link to="/dashboard/repurpose" className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
                Open Repurpose Studio
              </Link>
            }
          />
        ) : (
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-foreground">Pack</span>
              <select
                value={jobId}
                onChange={(e) => {
                  setJobId(e.target.value);
                  const found = packs.find((p) => p.id === e.target.value);
                  if (found) setTitle(found.title.slice(0, MAX_LISTING_TITLE));
                }}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                {packs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.pieceCount} posts)
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-foreground">Listing title</span>
              <input
                value={title}
                maxLength={MAX_LISTING_TITLE}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-foreground">What buyers get</span>
              <textarea
                value={description}
                maxLength={MAX_LISTING_DESCRIPTION}
                rows={3}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A 12-post launch sequence for SaaS founders, ready to schedule."
                className="mt-1.5 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>

            <div>
              <span className="text-xs font-semibold text-foreground">Card price</span>
              <div className="mt-1.5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPriceId("")}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${priceId === "" ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                >
                  None
                </button>
                {PACK_TIERS.map((t) => (
                  <button
                    key={t.priceId}
                    type="button"
                    onClick={() => setPriceId(t.priceId)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${priceId === t.priceId ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-foreground">Credit price</span>
              <div className="mt-1.5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCreditPrice(0)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${creditPrice === 0 ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                >
                  None
                </button>
                {CREDIT_PRICE_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCreditPrice(c)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${creditPrice === c ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                  >
                    {c} credits
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={() => void submit()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
              List pack for sale
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
