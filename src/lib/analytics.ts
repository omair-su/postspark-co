// Client-side analytics: UTM capture + event tracking.
// Events post to /api/public/track. Failures are silent.

const SESSION_KEY = "ps_session";
const UTM_KEY = "ps_utm";
const FIRST_TOUCH_KEY = "ps_first_touch";

type UTM = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
};

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let s = sessionStorage.getItem(SESSION_KEY);
    if (!s) {
      s = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem(SESSION_KEY, s);
    }
    return s;
  } catch {
    return "nosession";
  }
}

export function captureUTMs() {
  if (typeof window === "undefined") return;
  try {
    const p = new URLSearchParams(window.location.search);
    const incoming: UTM = {};
    (["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const).forEach((k) => {
      const v = p.get(k);
      if (v) (incoming as any)[k] = v.slice(0, 100);
    });
    if (document.referrer && !document.referrer.includes(window.location.host)) {
      incoming.referrer = document.referrer.slice(0, 200);
    }
    if (Object.keys(incoming).length > 0) {
      localStorage.setItem(UTM_KEY, JSON.stringify(incoming));
      if (!localStorage.getItem(FIRST_TOUCH_KEY)) {
        localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify({ ...incoming, at: Date.now() }));
      }
    }
  } catch {}
}

function getUTMs(): UTM {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(UTM_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function track(event: string, props?: Record<string, any>) {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify({
      event,
      session_id: getSessionId(),
      path: window.location.pathname,
      ...getUTMs(),
      props: props || null,
    });
    const url = "/api/public/track";
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
    } else {
      fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  } catch {}
}
