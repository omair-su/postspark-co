const MODELS = [
  { name: "Claude Sonnet 4.5", role: "Writing" },
  { name: "GPT-Image-2", role: "Images" },
  { name: "Flux 1.1 Pro", role: "Photorealism" },
  { name: "Gemini 3 Pro", role: "Multimodal" },
  { name: "ElevenLabs", role: "Voiceover" },
  { name: "Nano Banana 2", role: "Fast image edits" },
];

export function ModelsStripV3() {
  return (
    <section className="relative py-14 border-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="text-center text-xs uppercase tracking-[0.2em]" style={{ color: "rgba(250,250,249,0.5)" }}>
          Powered by the frontier
        </p>
        <div className="mt-6 flex flex-wrap justify-center items-center gap-2.5 sm:gap-3">
          {MODELS.map((m) => (
            <span
              key={m.name}
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs sm:text-sm"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.09)",
                color: "rgba(250,250,249,0.85)",
                backdropFilter: "blur(10px)",
              }}
            >
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "linear-gradient(135deg,#7C3AED,#06B6D4)", boxShadow: "0 0 8px rgba(124,58,237,0.7)" }}
              />
              <span className="font-medium">{m.name}</span>
              <span style={{ color: "rgba(250,250,249,0.45)" }}>· {m.role}</span>
            </span>
          ))}
        </div>
        <p className="mt-6 text-center text-[11px]" style={{ color: "rgba(250,250,249,0.4)" }}>
          Best-in-class models curated so you never wire up API keys.
        </p>
      </div>
    </section>
  );
}
