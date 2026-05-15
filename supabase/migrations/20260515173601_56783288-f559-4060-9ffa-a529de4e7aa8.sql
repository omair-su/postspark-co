
-- 1) Tag repurpose_jobs with the tool that produced them (repurpose, humanizer, reply_generator, copilot)
ALTER TABLE public.repurpose_jobs
  ADD COLUMN IF NOT EXISTS tool text NOT NULL DEFAULT 'repurpose';

CREATE INDEX IF NOT EXISTS idx_repurpose_jobs_user_tool_created
  ON public.repurpose_jobs (user_id, tool, created_at DESC);

-- 2) Spark Copilot conversations
CREATE TABLE IF NOT EXISTS public.copilot_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.copilot_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own conversations"
  ON public.copilot_conversations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own conversations"
  ON public.copilot_conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own conversations"
  ON public.copilot_conversations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users delete own conversations"
  ON public.copilot_conversations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_copilot_conversations_updated
  BEFORE UPDATE ON public.copilot_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Messages within a conversation
CREATE TABLE IF NOT EXISTS public.copilot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.copilot_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_copilot_messages_conv ON public.copilot_messages(conversation_id, created_at);

ALTER TABLE public.copilot_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own messages"
  ON public.copilot_messages FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users insert own messages"
  ON public.copilot_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own messages"
  ON public.copilot_messages FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
