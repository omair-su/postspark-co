import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Repeat,
  Image as ImageIcon,
  History,
  Settings,
  Flame,
  Calendar,
  FileText,
  Sparkles,
  Mic,
  BarChart3,
  Bookmark,
  Globe,
  Gift,
  Users,
  LayoutDashboard,
  HelpCircle,
  Layers,
} from "lucide-react";

type Action = {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
  shortcut?: string;
  keywords?: string;
};

const ACTIONS: Action[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, group: "Navigate", shortcut: "G D" },
  { label: "New Repurpose", to: "/dashboard/repurpose", icon: Repeat, group: "Create", shortcut: "G R", keywords: "create generate post tweet linkedin" },
  { label: "Image Studio", to: "/dashboard/image-studio", icon: ImageIcon, group: "Create", shortcut: "G I", keywords: "ai picture thumbnail" },
  { label: "Carousel Generator", to: "/dashboard/carousel", icon: Layers, group: "Create", keywords: "slides linkedin instagram swipe" },
  { label: "Thumbnail / Cover", to: "/dashboard/thumbnail", icon: ImageIcon, group: "Create", keywords: "youtube banner header podcast cover text overlay" },
  { label: "Podcast → Content", to: "/dashboard/podcast", icon: Mic, group: "Create", keywords: "audio voice transcribe episode" },
  { label: "Hook Lab", to: "/dashboard/hook-lab", icon: Flame, group: "Create", keywords: "viral title intro" },
  { label: "SEO Blog Writer", to: "/dashboard/seo-blog", icon: FileText, group: "Create", keywords: "article long form" },
  { label: "Templates", to: "/dashboard/templates", icon: Bookmark, group: "Create" },
  { label: "Calendar", to: "/dashboard/calendar", icon: Calendar, group: "Plan & Publish", keywords: "schedule plan" },
  { label: "History", to: "/dashboard/history", icon: History, group: "Plan & Publish", shortcut: "G H" },
  { label: "Brand Kit", to: "/dashboard/brand-kit", icon: Sparkles, group: "Brand", keywords: "logo colors fonts" },
  { label: "Brand Voice", to: "/dashboard/brand-voice", icon: Mic, group: "Brand", keywords: "tone style writing" },
  { label: "Analytics", to: "/dashboard/analytics", icon: BarChart3, group: "Insights" },
  { label: "Team", to: "/dashboard/team", icon: Users, group: "Insights" },
  { label: "Gallery", to: "/gallery", icon: Globe, group: "Browse", keywords: "public examples" },
  { label: "Refer & Earn", to: "/dashboard/referrals", icon: Gift, group: "Account" },
  { label: "Settings", to: "/dashboard/settings", icon: Settings, group: "Account", keywords: "billing plan upgrade" },
];

export function CommandPalette({
  open,
  onOpenChange,
  onShowShortcuts,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onShowShortcuts: () => void;
}) {
  const navigate = useNavigate();

  const run = useCallback(
    (to: string) => {
      onOpenChange(false);
      // tiny delay so the dialog animation can start before the route change
      setTimeout(() => navigate({ to: to as any }), 0);
    },
    [navigate, onOpenChange]
  );

  const grouped = ACTIONS.reduce<Record<string, Action[]>>((acc, a) => {
    (acc[a.group] = acc[a.group] || []).push(a);
    return acc;
  }, {});

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {Object.entries(grouped).map(([group, items], gi) => (
          <div key={group}>
            {gi > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {items.map((a) => (
                <CommandItem
                  key={a.to + a.label}
                  value={`${a.label} ${a.keywords ?? ""}`}
                  onSelect={() => run(a.to)}
                >
                  <a.icon className="mr-2 h-4 w-4" />
                  <span>{a.label}</span>
                  {a.shortcut && <CommandShortcut>{a.shortcut}</CommandShortcut>}
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
        <CommandSeparator />
        <CommandGroup heading="Help">
          <CommandItem
            value="keyboard shortcuts help"
            onSelect={() => {
              onOpenChange(false);
              onShowShortcuts();
            }}
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Keyboard shortcuts</span>
            <CommandShortcut>?</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/**
 * Mounts the command palette + global keyboard shortcuts (Cmd/Ctrl+K, g+r,
 * g+i, g+h, g+d, ?).  Renders only the palette UI; shortcut help shows in a
 * lightweight inline dialog.
 */
export function CommandPaletteRoot() {
  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let lastG = 0;

    const isTypingTarget = (el: EventTarget | null) => {
      const node = el as HTMLElement | null;
      if (!node) return false;
      const tag = node.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        node.isContentEditable
      );
    };

    const onKey = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K toggles palette — always works, even inside inputs
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }

      if (isTypingTarget(e.target)) return;

      // ? opens shortcut help
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setHelpOpen(true);
        return;
      }

      // g + <key> sequences — must press g, then a key within 800ms
      if (e.key.toLowerCase() === "g") {
        lastG = Date.now();
        return;
      }
      if (Date.now() - lastG < 800) {
        const map: Record<string, string> = {
          r: "/dashboard/repurpose",
          i: "/dashboard/image-studio",
          h: "/dashboard/history",
          d: "/dashboard",
          s: "/dashboard/settings",
          c: "/dashboard/calendar",
        };
        const to = map[e.key.toLowerCase()];
        if (to) {
          e.preventDefault();
          lastG = 0;
          navigate({ to: to as any });
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  return (
    <>
      <CommandPalette open={open} onOpenChange={setOpen} onShowShortcuts={() => setHelpOpen(true)} />
      <ShortcutHelp open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function ShortcutHelp({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const rows: Array<[string, string]> = [
    ["⌘K / Ctrl K", "Open command palette"],
    ["G then R", "Go to Repurpose"],
    ["G then I", "Go to Image Studio"],
    ["G then H", "Go to History"],
    ["G then C", "Go to Calendar"],
    ["G then D", "Go to Dashboard"],
    ["G then S", "Go to Settings"],
    ["?", "Show this help"],
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <div className="divide-y divide-border">
          {rows.map(([k, label]) => (
            <div key={k} className="flex items-center justify-between py-2.5">
              <span className="text-sm text-foreground">{label}</span>
              <kbd className="rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
                {k}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
