import { Link } from "@tanstack/react-router";

export function FooterV3() {
  return (
    <footer className="relative pt-16 pb-10 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <span aria-hidden className="h-7 w-7 rounded-lg" style={{ background: "linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)" }} />
              <span className="font-display-lux text-xl" style={{ color: "#FAFAF9" }}>PostSpark</span>
            </Link>
            <p className="mt-4 text-sm max-w-xs" style={{ color: "rgba(250,250,249,0.55)" }}>
              The luxury content engine for creators and agencies. One source → 30+ pieces in your voice.
            </p>
          </div>
          {[
            { title: "Product", links: [["Pricing","/pricing"], ["Gallery","/gallery"], ["Blog","/blog"], ["Founding lifetime","/deals/lifetime"]] },
            { title: "For", links: [["Creators","/for/creators"], ["Agencies","/for/agencies"], ["Podcasters","/for/podcasters"]] },
            { title: "Company", links: [["Privacy","/privacy"], ["Terms","/terms"], ["Data deletion","/data-deletion"]] },
          ].map((g) => (
            <div key={g.title}>
              <div className="text-xs uppercase tracking-widest" style={{ color: "rgba(250,250,249,0.5)" }}>{g.title}</div>
              <ul className="mt-4 space-y-2.5">
                {g.links.map(([label, to]) => (
                  <li key={to}>
                    <Link to={to} className="text-sm hover:text-white transition" style={{ color: "rgba(250,250,249,0.75)" }}>{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style={{ borderColor: "rgba(255,255,255,0.06)", color: "rgba(250,250,249,0.5)" }}>
          <div>© {new Date().getFullYear()} PostSpark. Built for creators.</div>
          <div>Made with Claude · Hosted on Lovable</div>
        </div>
      </div>
    </footer>
  );
}
