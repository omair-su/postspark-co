import { useState } from "react";
import { Send, Twitter, Linkedin, ChevronDown } from "lucide-react";

interface Props {
  content: string;
  formatId: string;
}

export function PublishMenu({ content, formatId }: Props) {
  const [open, setOpen] = useState(false);
  const text = content.trim().slice(0, 4000);
  const enc = encodeURIComponent(text);

  const links: { label: string; url: string; icon?: any; hint?: string }[] = [
    {
      label: "Schedule on Typefully",
      url: `https://typefully.com/?content=${enc}`,
      hint: "Opens Typefully composer with your draft",
    },
    {
      label: "Schedule on Buffer",
      url: `https://buffer.com/add?text=${enc}`,
      hint: "Opens Buffer with this content prefilled",
    },
  ];

  if (formatId === "tweets" || formatId === "thread") {
    links.push({
      label: "Post to X (Twitter)",
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text.slice(0, 280))}`,
    });
  }
  if (formatId === "linkedin") {
    links.push({
      label: "Open LinkedIn composer",
      icon: Linkedin,
      url: `https://www.linkedin.com/feed/?shareActive=true&text=${enc}`,
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-lg gradient-electric px-2.5 py-1 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Send className="h-3 w-3" /> Publish <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-64 rounded-xl border border-border bg-card p-1 shadow-lg">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-xs text-foreground hover:bg-muted"
              >
                <div className="font-medium">{l.label}</div>
                {l.hint && <div className="text-[10px] text-muted-foreground">{l.hint}</div>}
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
