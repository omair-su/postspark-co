/**
 * Turns anything a server-function handler can throw into a readable Error.
 *
 * Without this, a raw `Response` (auth middleware, provider fetch) crosses the
 * RPC boundary and the UI renders "[object Response]" instead of a message.
 */
export async function toReadableError(error: unknown, label: string): Promise<Error> {
  if (error instanceof Response) {
    let detail = "";
    try {
      detail = (await error.clone().text()).slice(0, 300);
    } catch {
      detail = "";
    }
    if (error.status === 401) return new Error("Your session expired. Please sign in again.");
    if (error.status === 403) return new Error("You don't have access to this. Try upgrading your plan.");
    if (error.status === 404) return new Error("We couldn't find what you asked for.");
    if (error.status === 429) return new Error("Too many requests right now — please try again in a moment.");
    console.error(`[${label}] response error ${error.status}: ${detail}`);
    return new Error("That didn't go through. Please try again in a moment.");
  }
  if (error instanceof Error) {
    console.error(`[${label}]`, error);
    return error;
  }
  console.error(`[${label}] unknown error`, error);
  return new Error("Something went wrong. Please try again.");
}

