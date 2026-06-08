export function PainSection() {
  const Item = ({ children }: { children: React.ReactNode }) => (
    <li className="flex items-start gap-2 text-sm" style={{ color: "#334155", lineHeight: 1.7 }}>
      <span style={{ color: "#94A3B8" }}>•</span> {children}
    </li>
  );

  return (
    <section style={{ background: "#FFFFFF" }} className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "#7C3AED", letterSpacing: "0.1em" }}
        >
          The problem
        </p>
        <h2
          className="mt-3 max-w-3xl text-3xl sm:text-4xl md:text-[44px]"
          style={{ color: "#0F172A", fontFamily: "Syne, Inter, system-ui, -apple-system, sans-serif", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.1 }}
        >
          You Create Great Content.
          <br />
          Reformatting It Kills Your Week.
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div
            className="rounded-2xl p-7"
            style={{
              background: "#FEF2F2",
              borderLeft: "4px solid #EF4444",
              border: "1px solid #FECACA",
              borderLeftWidth: 4,
            }}
          >
            <h3 className="text-xl font-bold" style={{ color: "#0F172A", fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
              😩 The Manual Way
            </h3>
            <ul className="mt-4 space-y-2">
              <Item>Write blog post: <strong>90 minutes</strong></Item>
              <Item>Rewrite as tweets: <strong>45 minutes</strong></Item>
              <Item>Rewrite for LinkedIn: <strong>60 minutes</strong></Item>
              <Item>Write newsletter version: <strong>45 minutes</strong></Item>
              <Item>Write video script: <strong>60 minutes</strong></Item>
            </ul>
            <hr className="my-4" style={{ borderColor: "#FECACA" }} />
            <p className="text-sm font-semibold" style={{ color: "#0F172A" }}>
              Total: 5+ hours. Same ideas. Just different formats.
            </p>
          </div>

          <div
            className="rounded-2xl p-7"
            style={{
              background: "#F0FDF4",
              borderLeft: "4px solid #10B981",
              border: "1px solid #BBF7D0",
              borderLeftWidth: 4,
            }}
          >
            <h3 className="text-xl font-bold" style={{ color: "#0F172A", fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
              ⚡ The PostSpark Way
            </h3>
            <ul className="mt-4 space-y-2">
              <Item>Paste your content: <strong>30 seconds</strong></Item>
              <Item>Select your formats: <strong>10 seconds</strong></Item>
              <Item>Click Generate: <strong>1 click</strong></Item>
              <Item>Get 30 pieces of content: <strong>60 seconds</strong></Item>
            </ul>
            <hr className="my-4" style={{ borderColor: "#BBF7D0" }} />
            <p className="text-sm font-semibold" style={{ color: "#0F172A" }}>
              Total: Under 2 minutes. Your voice. Every platform. Done.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
