import { getPaddleEnvironment } from "@/lib/paddle";

export function PaymentTestModeBanner() {
  if (getPaddleEnvironment() !== "sandbox") return null;

  return (
    <div className="w-full border-b border-amber-500/15 bg-amber-500/[0.06] px-4 py-1.5 text-center text-[11px] text-amber-700/90 dark:text-amber-300/80">
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500/70" />
        Test mode — payments are simulated.
        <a
          href="https://docs.lovable.dev/features/payments#test-and-live-environments"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 font-medium hover:opacity-80"
        >
          Learn more
        </a>
      </span>
    </div>
  );
}
