import { useEffect, useMemo, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  X, Send, Loader2, User as UserIcon, Plus, Trash2,
  History as HistoryIcon, Copy, RotateCcw, ArrowDownToLine, Paperclip, Search,
  Zap, Sparkles, Target, Mail, Briefcase, Flame, FileText, Video,
} from "lucide-react";
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
  { icon: Zap, label: "Write a hook", prompt: "Write a scroll-stopping hook about: " },
  { icon: Sparkles, label: "Humanize text", prompt: "Humanize this text so it reads naturally:\n\n" },
  { icon: Target, label: "10 hook ideas", prompt: "Give me 10 hook ideas in 5 different frameworks (Curiosity, PAS, AIDA, Pattern Interrupt, Bold Claim) about: " },
  { icon: Mail, label: "Email subject lines", prompt: "Write 8 high-open-rate email subject lines for: " },
  { icon: Briefcase, label: "LinkedIn post", prompt: "Write a LinkedIn post (200-300 words, hook + story + lesson + CTA) about: " },
  { icon: Flame, label: "Viral angle", prompt: "Give me a viral angle (contrarian or counter-intuitive take) on: " },
  { icon: FileText, label: "Blog outline", prompt: "Write a complete SEO blog outline (H2/H3, intro, key sections, CTA) for: " },
  { icon: Video, label: "Video script", prompt: "Write a 60-second video script (Hook, Build, Payoff, CTA) about: " },
];

const TOOL_LABELS: Record<string, string> = {
  "seo-blog": "SEO Blog",
  "hook-lab": "Hook Lab",
  "humanizer": "AI Humanizer",
  "repurpose": "Repurpose Studio",
  "carousel": "Carousel Maker",
  "image-studio": "Image Studio",
  "reply-generator": "Reply Generator",
  "thumbnail": "Thumbnail Studio",
  "podcast": "Podcast Studio",
  "brand-voice": "Brand Voice",
  "calendar": "Content Calendar",
};

const TOOL_WELCOME: Record<string, string> = {
  "seo-blog": "I see you're writing a blog. Want me to write 5 title ideas for your keyword, or improve your intro paragraph?",
  "hook-lab": "Need a scroll-stopping hook? Give me your topic and I'll write 10 hooks in 5 different frameworks.",
  "humanizer": "Paste any AI-sounding text and I'll rewrite it so it flows naturally — no robotic rhythm.",
  "repurpose": "Drop your source content and tell me which format you want next — tweets, LinkedIn, thread, email, or script.",
  "carousel": "Want a carousel that gets saves? Give me a topic and I'll write all 8 slides — hook, frames, CTA.",
  "image-studio": "Need a thumbnail or post image? Describe the vibe and I'll suggest 3 directions.",
  "reply-generator": "Paste the post you want to reply to. I'll write 5 sharp angles — agree, contrarian, story, question, joke.",
};

function getToolKey(pathname: string): string | null {
  const m = pathname.match(/\/dashboard\/([a-z-]+)/);
  return m?.[1] ?? null;
}

function SparkOrb({ size = 36 }: { size?: number }) {
  return (
    <div
      className="relative shrink-0 rounded-full"
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 rounded-full animate-spark-pulse"
        style={{
          background: "radial-gradient(circle at 30% 30%, #a78bfa 0%, #7c3aed 45%, #5b21b6 100%)",
          boxShadow: "0 0 24px rgba(124, 58, 237, 0.55), inset 0 0 12px rgba(255,255,255,0.25)",
        }}
      />
      <div
        className="absolute rounded-full bg-[#14142B]/60 blur-[1px]"
        style={{ width: size * 0.18, height: size * 0.18, top: size * 0.22, left: size * 0.26 }}
      />
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-[#7c3aed] animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export function SparkCopilot() {
  const { session } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const toolKey = getToolKey(pathname);
  const toolLabel = toolKey ? TOOL_LABELS[toolKey] ?? null : null;

  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyQuery, setHistoryQuery] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [contextContent, setContextContent] = useState("");
  const [showContext, setShowContext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [convId, setConvId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const authHeaders = session ? { Authorization: `Bearer ${session.access_token}` } : undefined;

  const welcome = useMemo(() => {
    if (toolKey && TOOL_WELCOME[toolKey]) return TOOL_WELCOME[toolKey];
    return "Hi, I'm Spark — your AI content director. Pick a quick action below or ask me anything about hooks, posts, blogs, or scripts.";
  }, [toolKey]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOpen = () => setOpen(true);
    window.addEventListener("postspark:open-copilot", onOpen);
    return () => window.removeEventListener("postspark:open-copilot", onOpen);
  }, []);

  useEffect(() => {
    if (open && !showHistory) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open, showHistory]);

  async function refreshConversations() {
    if (!authHeaders) return;
    try {
      const r = await listCopilotConversations({ headers: authHeaders });
      setConversations(r.conversations as Conv[]);
    } catch {}
  }

  useEffect(() => {
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
        data: {
          messages: next.slice(-20),
          conversationId: convId,
          currentTool: toolLabel,
          contextContent: contextContent.trim() || null,
        },
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
    setInput(prompt);
    setTimeout(() => {
      inputRef.current?.focus();
      const el = inputRef.current;
      if (el) el.setSelectionRange(el.value.length, el.value.length);
    }, 30);
  }

  async function copyMessage(content: string) {
    try { await navigator.clipboard.writeText(content); } catch {}
  }

  function insertIntoEditor(content: string) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("postspark:insert-from-copilot", { detail: { content } }));
  }

  async function regenerate() {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    // pop last assistant
    setMessages((prev) => {
      const copy = [...prev];
      while (copy.length && copy[copy.length - 1].role !== "user") copy.pop();
      return copy;
    });
    await send(lastUser.content);
  }

  const filteredConvs = conversations.filter((c) =>
    !historyQuery.trim() || c.title.toLowerCase().includes(historyQuery.toLowerCase()),
  );

  function platformTag(title: string): string | null {
    const t = title.toLowerCase();
    if (t.includes("linkedin")) return "LinkedIn";
    if (t.includes("tweet") || t.includes("twitter") || t.includes("thread")) return "Twitter";
    if (t.includes("email")) return "Email";
    if (t.includes("blog") || t.includes("seo")) return "Blog";
    if (t.includes("hook")) return "Hooks";
    if (t.includes("script") || t.includes("video")) return "Video";
    if (t.includes("carousel")) return "Carousel";
    return null;
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="group fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-2 rounded-full bg-[#14142B] border border-[#7c3aed]/20 pl-1.5 pr-4 py-1.5 shadow-xl shadow-[#7c3aed]/20 hover:shadow-[#7c3aed]/40 hover:-translate-y-0.5 transition-all"
          aria-label="Open Spark Copilot"
        >
          <SparkOrb size={32} />
          <span className="text-sm font-semibold text-white">Spark</span>
          <span className="hidden sm:inline text-[10px] uppercase tracking-[0.18em] text-white/55">Ask AI</span>
        </button>
      )}

      {open && (
        <div
          className="fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden bg-[#14142B]"
          style={{
            width: "min(380px, calc(100vw - 2rem))",
            height: "min(560px, calc(100vh - 3rem))",
            borderRadius: 16,
            boxShadow: "0 25px 60px -15px rgba(124, 58, 237, 0.35), 0 10px 30px rgba(15,23,42,0.12)",
            border: "1px solid rgba(124,58,237,0.12)",
          }}
        >
          {/* Header — dark gradient */}
          <div
            className="px-4 pt-3.5 pb-3"
            style={{ background: "linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <SparkOrb size={36} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-white leading-tight">Spark</span>
                    <span className="text-[9.5px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(124,58,237,0.18)", color: "#c4b5fd", border: "0.5px solid rgba(124,58,237,0.3)" }}>
                      Claude 5
                    </span>
                  </div>
                  <div className="text-[11.5px] text-white/55 truncate">
                    {toolLabel ? `Helping with ${toolLabel}` : "PostSpark's AI creative brain"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <button onClick={newChat} title="New chat" className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-white/70 hover:bg-[#14142B]/10 hover:text-white transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowHistory((v) => !v)}
                  title="History"
                  className={`h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors ${showHistory ? "bg-[#14142B]/15 text-white" : "text-white/70 hover:bg-[#14142B]/10 hover:text-white"}`}
                >
                  <HistoryIcon className="h-4 w-4" />
                </button>
                <button onClick={() => setOpen(false)} title="Close" className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-white/70 hover:bg-[#14142B]/10 hover:text-white transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          {/* gradient hairline */}
          <div className="h-[2px] w-full" style={{ background: "linear-gradient(90deg, transparent, #7c3aed 50%, transparent)" }} />

          {showHistory ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-3 pt-3 pb-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/45" />
                  <input
                    value={historyQuery}
                    onChange={(e) => setHistoryQuery(e.target.value)}
                    placeholder="Search conversations"
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-white/10 bg-[#14142B] focus:outline-none focus:border-[#7c3aed]/50 focus:ring-2 focus:ring-[#7c3aed]/10"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
                {filteredConvs.length === 0 ? (
                  <div className="text-xs text-white/45 p-6 text-center">No saved conversations yet.</div>
                ) : (
                  filteredConvs.map((c) => {
                    const tag = platformTag(c.title);
                    const title = c.title.split(/\s+/).slice(0, 6).join(" ");
                    return (
                      <div
                        key={c.id}
                        onClick={() => loadConversation(c.id)}
                        className={`group flex items-start gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${convId === c.id ? "bg-[#7c3aed]/15" : "hover:bg-white/5"}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-white/90 truncate">{title}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {tag && (
                              <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full bg-[#7c3aed]/10 text-[#7c3aed] font-medium">
                                {tag}
                              </span>
                            )}
                            <span className="text-[10px] text-white/45">{new Date(c.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => removeConversation(c.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-white/45 hover:text-red-400 hover:bg-red-500/15 transition"
                          aria-label="Delete"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-[#14142B]">
                {messages.length === 0 && (
                  <div className="space-y-3 animate-spark-in">
                    <div className="flex gap-2.5">
                      <SparkOrb size={28} />
                      <div className="flex-1 rounded-2xl rounded-tl-sm border border-white/8 bg-[#14142B] px-3.5 py-2.5 text-[13px] text-white/85 leading-relaxed shadow-sm">
                        {welcome}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {QUICK_ACTIONS.map((a) => (
                        <button
                          key={a.label}
                          onClick={() => applyQuickAction(a.prompt)}
                          className="group flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-white/10 bg-[#14142B] text-left text-[11.5px] font-medium text-white/85 hover:border-[#7c3aed]/40 hover:bg-[#7c3aed]/10 hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#7c3aed]/10 transition-all"
                        >
                          <a.icon className="h-3.5 w-3.5 text-[#7c3aed] shrink-0" />
                          <span className="truncate">{a.label}</span>
                        </button>
                      ))}
                    </div>
                    {/* Content context paste */}
                    <div className="pt-1">
                      <button
                        onClick={() => setShowContext((v) => !v)}
                        className="text-[10.5px] uppercase tracking-wider font-semibold text-white/45 hover:text-[#7c3aed] transition"
                      >
                        {showContext ? "− Hide content context" : "+ Add content context (optional)"}
                      </button>
                      {showContext && (
                        <textarea
                          value={contextContent}
                          onChange={(e) => setContextContent(e.target.value.slice(0, 4000))}
                          placeholder="Paste any content here for Spark to work with…"
                          rows={3}
                          className="mt-1.5 w-full text-[12px] rounded-lg border border-white/10 bg-[#14142B] px-3 py-2 placeholder:text-white/45 focus:outline-none focus:border-[#7c3aed]/50 focus:ring-2 focus:ring-[#7c3aed]/10 resize-y"
                        />
                      )}
                    </div>
                  </div>
                )}

                {messages.map((m, i) => {
                  const isUser = m.role === "user";
                  const isLastAssistant = !isUser && i === messages.length - 1 && !loading;
                  return (
                    <div key={i} className={`flex gap-2 animate-spark-in ${isUser ? "flex-row-reverse" : ""}`}>
                      {isUser ? (
                        <div className="h-7 w-7 rounded-full shrink-0 flex items-center justify-center bg-white/10">
                          <UserIcon className="h-3.5 w-3.5 text-white/70" />
                        </div>
                      ) : (
                        <SparkOrb size={28} />
                      )}
                      <div className={`max-w-[82%] ${isUser ? "" : "space-y-1.5"}`}>
                        <div
                          className={
                            isUser
                              ? "rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-[13px] text-white/90 bg-[#7c3aed]/20 border border-[#7c3aed]/10"
                              : "rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-[13px] text-white/90 bg-[#14142B] border border-white/8 shadow-sm"
                          }
                        >
                          {isUser ? (
                            <div className="whitespace-pre-wrap">{m.content}</div>
                          ) : (
                            <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-headings:my-1.5 text-[13px]">
                              <ReactMarkdown>{m.content}</ReactMarkdown>
                            </div>
                          )}
                        </div>
                        {isLastAssistant && (
                          <div className="flex items-center gap-1 pl-1">
                            <button onClick={() => copyMessage(m.content)} className="inline-flex items-center gap-1 text-[10.5px] text-white/55 hover:text-[#7c3aed] px-1.5 py-1 rounded hover:bg-[#7c3aed]/15 transition">
                              <Copy className="h-3 w-3" /> Copy
                            </button>
                            <button onClick={() => insertIntoEditor(m.content)} className="inline-flex items-center gap-1 text-[10.5px] text-white/55 hover:text-[#7c3aed] px-1.5 py-1 rounded hover:bg-[#7c3aed]/15 transition">
                              <ArrowDownToLine className="h-3 w-3" /> Insert
                            </button>
                            <button onClick={regenerate} className="inline-flex items-center gap-1 text-[10.5px] text-white/55 hover:text-[#7c3aed] px-1.5 py-1 rounded hover:bg-[#7c3aed]/15 transition">
                              <RotateCcw className="h-3 w-3" /> Regenerate
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex gap-2 animate-spark-in">
                    <SparkOrb size={28} />
                    <div className="rounded-2xl rounded-tl-sm bg-[#14142B] border border-white/8 shadow-sm">
                      <TypingDots />
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-white/8 bg-[#14142B]">
                <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-[#14142B] px-2.5 py-1.5 focus-within:border-[#7c3aed]/50 focus-within:ring-2 focus-within:ring-[#7c3aed]/10 transition">
                  <button
                    title="Attach (coming soon)"
                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-white/45 hover:text-[#7c3aed] hover:bg-[#7c3aed]/15 transition shrink-0"
                    disabled
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                    }}
                    placeholder="Ask Spark anything…"
                    rows={1}
                    className="flex-1 resize-none bg-transparent py-1.5 text-[13px] text-white/90 placeholder:text-white/45 focus:outline-none max-h-[96px]"
                    disabled={loading}
                  />
                  <button
                    onClick={() => send()}
                    disabled={loading || !input.trim()}
                    className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/30 hover:bg-[#6d28d9] disabled:opacity-40 disabled:shadow-none transition shrink-0"
                    aria-label="Send"
                  >
                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <div className="mt-1.5 px-1 text-[10px] text-white/45 flex items-center justify-between">
                  <span>Press Enter to send · Shift+Enter for new line</span>
                  {toolLabel && <span className="text-[#7c3aed]/70 font-medium">{toolLabel}</span>}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
