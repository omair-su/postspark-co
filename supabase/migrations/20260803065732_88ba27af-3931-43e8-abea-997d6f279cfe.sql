DROP POLICY IF EXISTS "Users manage own analytics cache" ON public.analytics_cache;
CREATE POLICY "Users manage own analytics cache" ON public.analytics_cache FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);