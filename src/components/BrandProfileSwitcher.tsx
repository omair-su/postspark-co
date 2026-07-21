import { useEffect, useState } from "react";
import { Briefcase, Check, ChevronDown, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  listBrandKits,
  createBrandKit,
  setActiveBrandKit,
  deleteBrandKit,
} from "@/lib/brandKit.functions";

interface Kit {
  id: string;
  name: string;
  is_active: boolean;
  brand_name: string | null;
}

interface Props {
  onActiveChange?: () => void;
}

/**
 * Multi-profile switcher for the Brand Kit page.
 * Lets Pro/Agency users manage several client brand profiles.
 */
export function BrandProfileSwitcher({ onActiveChange }: Props) {
  const { session } = useAuth();
  const [kits, setKits] = useState<Kit[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const auth = session ? { headers: { Authorization: `Bearer ${session.access_token}` } } : undefined;

  const refresh = async () => {
    if (!auth) return;
    try {
      const { kits } = await listBrandKits(auth);
      setKits((kits as Kit[]) || []);
    } catch {
      /* silent */
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [session]);

  const active = kits.find((k) => k.is_active) || kits[0];

  const handleSwitch = async (id: string) => {
    if (!auth || busy) return;
    setBusy(true);
    try {
      await setActiveBrandKit({ data: { id }, ...auth });
      await refresh();
      onActiveChange?.();
      setOpen(false);
    } catch {
      toast.error("Could not switch profile");
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async () => {
    if (!auth) return;
    const name = newName.trim();
    if (!name) return toast.error("Give the profile a name");
    setBusy(true);
    try {
      const res = await createBrandKit({ data: { name }, ...auth });
      if (!res.success) {
        toast.error(res.error || "Could not create profile");
      } else {
        toast.success(`Created "${name}"`);
        setNewName("");
        setCreating(false);
        await refresh();
        onActiveChange?.();
        setOpen(false);
      }
    } catch {
      toast.error("Could not create profile");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (k: Kit) => {
    if (!auth) return;
    if (!confirm(`Delete brand profile "${k.name}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await deleteBrandKit({ data: { id: k.id }, ...auth });
      if (!res.success) {
        toast.error(res.error || "Could not delete");
      } else {
        toast.success("Profile deleted");
        await refresh();
        onActiveChange?.();
      }
    } catch {
      toast.error("Could not delete");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group inline-flex items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-900/60 px-3 py-2 text-sm font-medium text-slate-100 backdrop-blur-xl transition hover:border-violet-500/40 hover:bg-slate-900/80"
      >
        <Briefcase className="h-4 w-4 text-violet-400" />
        <span className="max-w-[160px] truncate">{active?.name || "Default"}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute left-0 right-auto z-50 mt-2 w-72 overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/95 shadow-2xl shadow-violet-950/40 backdrop-blur-xl"
          onMouseLeave={() => !creating && setOpen(false)}
        >
          <div className="border-b border-slate-800/70 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Brand profiles
          </div>
          <div className="max-h-64 overflow-y-auto">
            {kits.length === 0 ? (
              <div className="px-3 py-4 text-xs text-slate-500">No profiles yet.</div>
            ) : (
              kits.map((k) => (
                <div
                  key={k.id}
                  className={`group flex items-center gap-2 px-3 py-2 text-sm transition ${
                    k.is_active
                      ? "bg-violet-500/10 text-white"
                      : "text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSwitch(k.id)}
                    disabled={busy || k.is_active}
                    className="flex flex-1 items-center gap-2 text-left disabled:cursor-default"
                  >
                    {k.is_active ? (
                      <Check className="h-3.5 w-3.5 text-violet-400" />
                    ) : (
                      <span className="h-3.5 w-3.5" />
                    )}
                    <span className="truncate">{k.name}</span>
                    {k.brand_name && (
                      <span className="truncate text-[10px] text-slate-500">· {k.brand_name}</span>
                    )}
                  </button>
                  {kits.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDelete(k)}
                      disabled={busy}
                      className="rounded p-1 text-slate-500 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400"
                      title="Delete profile"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-800/70 p-2">
            {creating ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                    if (e.key === "Escape") { setCreating(false); setNewName(""); }
                  }}
                  placeholder="e.g. Acme Corp"
                  className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-violet-500"
                />
                <button
                  onClick={handleCreate}
                  disabled={busy}
                  className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-violet-300 hover:bg-violet-500/10"
              >
                <Plus className="h-3.5 w-3.5" /> Create new profile
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
