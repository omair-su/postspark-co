export function SocialProofBar() {
  return (
    <section style={{ background: "#F8FAFC" }} className="border-y" >
      <div
        className="mx-auto max-w-7xl px-4 py-8 text-center sm:px-6"
        style={{ borderColor: "#E2E8F0" }}
      >
        <p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "#64748B", letterSpacing: "0.1em" }}
        >
          Join early creators building with PostSpark
        </p>
        <div
          className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-semibold"
          style={{ color: "#0F172A" }}
        >
          <span className="inline-flex items-center gap-2">🚀 Live on Product Hunt</span>
          <span className="hidden h-1 w-1 rounded-full sm:inline-block" style={{ background: "#CBD5E1" }} />
          <span className="inline-flex items-center gap-2">💡 Listed on Indie Hackers</span>
          <span className="hidden h-1 w-1 rounded-full sm:inline-block" style={{ background: "#CBD5E1" }} />
          <span className="inline-flex items-center gap-2">⚡ Powered by Claude AI</span>
        </div>
      </div>
    </section>
  );
}
