import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send, Loader2, Bot, User as UserIcon } from "lucide-react";
import { sparkChat } from "@/lib/copilot.functions";
import ReactMarkdown from "react-markdown";

interface Msg { role: "user" | "assistant"; content: string }

const STORAGE_KEY = "postspark.copilot.history";

export function SparkCopilot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30))); } catch {}
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const r = await sparkChat({ data: { messages: next.slice(-20) } });
      if (r.error) {
        setMessages([...next, { role: "assistant", content: `⚠️ ${r.error}` }]);
      } else {
        setMessages([...next, { role: "assistant", content: r.reply || "(no reply)" }]);
      }
    } catch (e: any) {
      setMessages([...next, { role: "assistant", content: `⚠️ ${e?.message || "Failed to reach Spark."}` }]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([]);
    sessionStorage.removeItem(STORAGE_KEY);
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
        <div className="fixed bottom-6 right-6 z-50 w-[min(420px,calc(100vw-2rem))] h-[min(620px,calc(100vh-3rem))] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden">
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
              {messages.length > 0 && (
                <button onClick={clearChat} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded">Clear</button>
              )}
              <button onClick={() => setOpen(false)} className="p-1.5 rounded hover:bg-muted" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-sm text-muted-foreground space-y-3">
                <p>Hi! I'm Spark. Ask me anything about your content:</p>
                <div className="space-y-1.5">
                  {[
                    "Brainstorm 5 hooks about productivity",
                    "Rewrite this tweet to be punchier",
                    "What should I post on LinkedIn today?",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="block w-full text-left px-3 py-2 rounded-lg border border-border hover:border-electric/40 text-xs"
                    >
                      {s}
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

          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask Spark anything…"
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-electric/40"
                disabled={loading}
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="px-3 rounded-xl bg-electric text-white disabled:opacity-50 flex items-center justify-center"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
