import { toast as sonner, type ExternalToast } from "sonner";

/**
 * Thin wrapper around sonner that:
 * - Dedupes repeated toasts via stable IDs (use `key` to suppress spam from
 *   the same action firing rapidly)
 * - Caps default duration so success toasts disappear quickly
 *
 * Usage:
 *   notify.success("Saved", { key: "settings:saved" })
 *   notify.error("Couldn't save", { key: "settings:save-failed" })
 */
type Opts = ExternalToast & { key?: string };

function withDefaults(opts?: Opts): ExternalToast {
  const { key, ...rest } = opts || {};
  return { id: key, duration: 2400, ...rest };
}

export const notify = {
  success: (msg: string, opts?: Opts) => sonner.success(msg, withDefaults(opts)),
  error: (msg: string, opts?: Opts) => sonner.error(msg, { ...withDefaults(opts), duration: 4000 }),
  info: (msg: string, opts?: Opts) => sonner(msg, withDefaults(opts)),
  loading: (msg: string, opts?: Opts) => sonner.loading(msg, withDefaults({ duration: 60000, ...opts })),
  dismiss: (id?: string) => sonner.dismiss(id),
};
