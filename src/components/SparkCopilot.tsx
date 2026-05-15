import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send, Loader2, Bot, User as UserIcon, Wand2, MessageSquare, History as HistoryIcon, Plus, Trash2 } from "lucide-react";
import {
  sparkChat,
  listCopilotConversations,
  getCopilotConversation,
  deleteCopilotConversation,
} from "@/lib/copilot.functions";
import { useAuth } from "@/hooks/useAuth";
import ReactMarkdown from "react-markdown";

interface Msg { role: "user" | "assistant"; content: string }
interface Conv { id: string; title: string; updated_at: string }

const QUICK_ACTIONS = [
  { icon: Wand2, label: "Humanize text", prompt: "Humanize this text so it reads naturally:\n\n" },
  { icon: MessageSquare, label: "Generate replies", prompt: "Write 5 reply options to this post (vary the angle, keep them human):\n\n" },
  { icon: Sparkles, label: "5 viral hooks", prompt: "Give me 5 scroll-stopping hooks about: " },
];

export function SparkCopilot() {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [convId, setConvId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const authHeaders = session ? { Authorization: `Bearer ${session.access_token}` } : undefined;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  async function refreshConversations() {
    if (!authHeaders) return;
    try {
      const r = await listCopilotConversations({ headers: authHeaders });
      setConversations(r.conversations as Conv[]);
    } catch {}
  }

  useEffect(() => {
    if (open && !showHistory) return;
    if (open && showHistory) refreshConversations();
  }, [open, showHistory]);

  async function send(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || loading || !authHeaders) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const r = await sparkChat({
        data: { messages: next.slice(-20), conversationId: convId },
        headers: authHeaders,
      });
      if ((r as any).error) {
        setMessages([...next, { role: "assistant", content: `⚠️ ${(r as any).error}` }]);
      } else {
        setMessages([...next, { role: "assistant", content: r.reply || "(no reply)" }]);
        if ((r as any).conversationId) setConvId((r as any).conversationId);
      }
    } catch (e: any) {
      setMessages([...next, { role: "assistant", content: `⚠️ ${e?.message || "Failed to reach Spark."}` }]);
    } finally {
      setLoading(false);
    }
  }

  function newChat() {
    setMessages([]);
    setConvId(null);
    setShowHistory(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  async function loadConversation(id: string) {
    if (!authHeaders) return;
    setLoading(true);
    setShowHistory(false);
    try {
      const r = await getCopilotConversation({ data: { id }, headers: authHeaders });
      const msgs: Msg[] = (r.messages || [])
        .filter((m: any) => m.role === "user" || m.role === "assistant")
        .map((m: any) => ({ role: m.role, content: m.content }));
      setMessages(msgs);
      setConvId(id);
    } finally {
      setLoading(false);
    }
  }

  async function removeConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!authHeaders) return;
    if (!confirm("Delete this conversation?")) return;
    await deleteCopilotConversation({ data: { id }, headers: authHeaders });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (convId === id) newChat();
  }

  function applyQuickAction(prompt: string) {
    setInput((prev) => (prev ? prev : prompt));
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-gradient-to-br from-electric to-electric/70 text-white shadow-2xl shadow-electric/40 flex items-center justify-center hover:scale-105 transition"
          aria-label="Open Spark Copilot"
        >
          <Sparkles className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[min(440px,calc(100vw-2rem))] h-[min(660px,calc(100vh-3rem))] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-electric/10 to-amber-500/10">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-electric to-electric/70 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="font-semibold text-sm">Spark Copilot</div>
                <div className="text-[11px] text-muted-foreground">AI assistant for your content</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={newChat} title="New chat" className="p-1.5 rounded hover:bg-muted">
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowHistory((v) => !v)}
                title="Conversation history"
                className={`p-1.5 rounded hover:bg-muted ${showHistory ? "bg-muted" : ""}`}
              >
                <HistoryIcon className="h-4 w-4" />
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded hover:bg-muted" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {showHistory ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <div className="text-xs text-muted-foreground px-2 py-1">Recent conversations</div>
              {conversations.length === 0 ? (
                <div className="text-xs text-muted-foreground p-4 text-center">No saved conversations yet.</div>
              ) : (
                conversations.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => loadConversation(c.id)}
                    className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted ${convId === c.id ? "bg-muted" : ""}`}
                  >
                    <Bot className="h-3.5 w-3.5 text-electric shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{c.title}</div>
                      <div className="text-[10px] text-muted-foreground">{new Date(c.updated_at).toLocaleString()}</div>
                    </div>
                    <button
                      onClick={(e) => removeConversation(c.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-sm text-muted-foreground space-y-3">
                    <p>Hi! I'm Spark. Try a quick action or ask me anything:</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {QUICK_ACTIONS.map((a) => (
                        <button
                          key={a.label}
                          onClick={() => applyQuickAction(a.prompt)}
                          className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg border border-border hover:border-electric/40 text-xs"
                        >
                          <a.icon className="h-3.5 w-3.5 text-electric" />
                          <span className="font-medium">{a.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`h-7 w-7 rounded-full shrink-0 flex items-center justify-center ${m.role === "user" ? "bg-muted" : "bg-electric/15 text-electric"}`}>
                      {m.role === "user" ? <UserIcon className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                    </div>
                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-electric text-white" : "bg-muted"}`}>
                      {m.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 dark:prose-invert">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-2">
                    <div className="h-7 w-7 rounded-full bg-electric/15 text-electric flex items-center justify-center">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <div className="bg-muted rounded-2xl px-3 py-2 text-sm flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> thinking…
                    </div>
                  </div>
                )}
              </div>

              {messages.length > 0 && (
                <div className="px-3 pb-2 flex flex-wrap gap-1.5 border-t border-border pt-2">
                  {QUICK_ACTIONS.map((a) => (
                    <button
                      key={a.label}
                      onClick={() => applyQuickAction(a.prompt)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border text-[11px] hover:border-electric/40"
                    >
                      <a.icon className="h-3 w-3 text-electric" />
                      {a.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="p-3 border-t border-border">
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder="Ask Spark anything…"
                    rows={1}
                    className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-electric/40 max-h-32"
                    disabled={loading}
                  />
                  <button
                    onClick={() => send()}
                    disabled={loading || !input.trim()}
                    className="px-3 py-2 rounded-xl bg-electric text-white disabled:opacity-50 flex items-center justify-center"
                    aria-label="Send"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
