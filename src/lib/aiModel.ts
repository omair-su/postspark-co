/**
 * Single source of truth for the Claude model used across PostSpark.
 * Change this file (or set CLAUDE_MODEL env var on the server) to upgrade.
 *
 * Safe to import from both client and server — no secrets, only identifiers.
 */

// Server env override wins; otherwise use the default. `process` may be
// undefined in the browser, so guard the access.
const envModel =
  typeof process !== "undefined" && process.env && process.env.CLAUDE_MODEL
    ? process.env.CLAUDE_MODEL
    : undefined;

/** API model id sent to Anthropic. */
export const CLAUDE_MODEL_ID: string = envModel || "claude-sonnet-5";

/** Human-readable label shown in the UI (hero status, footers, comparisons). */
export const CLAUDE_MODEL_LABEL = "Claude Sonnet 5";
