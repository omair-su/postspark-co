import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { getPostsThisWeek } from "@/lib/socialProof.functions";

export function LiveCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    getPostsThisWeek()
      .then((r) => setCount(r.count))
      .catch(() => setCount(null));
  }, []);

  if (count === null || count < 1) return null;

  const display = count.toLocaleString();
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <Activity className="h-3 w-3" />
      {display} posts repurposed this week
    </div>
  );
}
