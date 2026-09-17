CREATE TABLE public.marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  job_id uuid REFERENCES public.repurpose_jobs(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  platforms text[] NOT NULL DEFAULT '{}',
  preview jsonb NOT NULL DEFAULT '{}'::jsonb,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  price_id text,
  credit_price integer,
  status text NOT NULL DEFAULT 'published',
  sales_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.marketplace_listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_listings TO authenticated;
GRANT ALL ON public.marketplace_listings TO service_role;

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published listings are readable"
  ON public.marketplace_listings FOR SELECT
  USING (status = 'published' OR seller_id = auth.uid());

CREATE POLICY "Sellers create own listings"
  ON public.marketplace_listings FOR INSERT TO authenticated
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers update own listings"
  ON public.marketplace_listings FOR UPDATE TO authenticated
  USING (seller_id = auth.uid()) WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers delete own listings"
  ON public.marketplace_listings FOR DELETE TO authenticated
  USING (seller_id = auth.uid());

CREATE INDEX idx_marketplace_listings_status ON public.marketplace_listings(status, created_at DESC);
CREATE INDEX idx_marketplace_listings_seller ON public.marketplace_listings(seller_id);

CREATE TRIGGER marketplace_listings_updated_at
  BEFORE UPDATE ON public.marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.marketplace_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL,
  method text NOT NULL,
  amount_cents integer,
  credits_spent integer,
  transaction_id text,
  copied_job_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.marketplace_purchases TO authenticated;
GRANT ALL ON public.marketplace_purchases TO service_role;

ALTER TABLE public.marketplace_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers and sellers read purchases"
  ON public.marketplace_purchases FOR SELECT TO authenticated
  USING (
    buyer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.marketplace_listings l
      WHERE l.id = listing_id AND l.seller_id = auth.uid()
    )
  );

CREATE UNIQUE INDEX idx_marketplace_purchases_txn
  ON public.marketplace_purchases(transaction_id, listing_id)
  WHERE transaction_id IS NOT NULL;
CREATE INDEX idx_marketplace_purchases_buyer ON public.marketplace_purchases(buyer_id, created_at DESC);