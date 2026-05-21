import { Youtube, Linkedin, FileText, Mail, Mic, Twitter } from "lucide-react";

const integrations = [
  { icon: Youtube, label: "YouTube" },
  { icon: Twitter, label: "X / Twitter" },
  { icon: Linkedin, label: "LinkedIn" },
  { icon: FileText, label: "Notion" },
  { icon: Mail, label: "Substack" },
  { icon: Mic, label: "Podcasts" },
];

export function IntegrationsLogoBar() {
  return (
    <section className="relative isolate overflow-hidden cream-surface-alt py-10 px-6">
      <div className="cream-grain" aria-hidden />
      <div className="relative mx-auto max-w-5xl">
        <p className="text-center text-[11px] uppercase tracking-[0.18em] text-[#1a1a2e]/55">
          Works with the tools you already use
        </p>
        <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:gap-x-12">
          {integrations.map((i) => (
            <li
              key={i.label}
              className="flex items-center gap-2 text-[#1a1a2e]/70 transition-colors hover:text-[#7c3aed]"
            >
              <i.icon className="h-4 w-4" aria-hidden />
              <span className="text-sm font-medium tracking-tight">{i.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
