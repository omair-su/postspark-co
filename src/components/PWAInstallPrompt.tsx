import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY = "ps_pwa_prompt_state_v1";
const READY_KEY = "ps_pwa_ready_v1"; // set after first successful repurpose

export function PWAInstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Gate: only show after the user has completed at least one repurpose
    if (localStorage.getItem(READY_KEY) !== "1") {
      const onReady = () => {
        // Re-trigger by reloading the effect on next mount; simplest is to set state
        if (localStorage.getItem(READY_KEY) === "1") setVisible((v) => v); // no-op; effect re-evaluates via window reload pattern
      };
      window.addEventListener("postspark:pwa-ready", onReady);
      // We still want to attach beforeinstallprompt early so we can capture it
      // and show later — but only if not dismissed/installed.
      const stateEarly = localStorage.getItem(STORAGE_KEY);
      if (stateEarly === "dismissed" || stateEarly === "installed") {
        return () => window.removeEventListener("postspark:pwa-ready", onReady);
      }
      const onBIPEarly = (e: Event) => {
        e.preventDefault();
        setDeferred(e as BIPEvent);
        if (localStorage.getItem(READY_KEY) === "1") setVisible(true);
      };
      const onReadyShow = () => {
        if (deferred || /iPad|iPhone|iPod/.test(window.navigator.userAgent)) setVisible(true);
      };
      window.addEventListener("beforeinstallprompt", onBIPEarly);
      window.addEventListener("postspark:pwa-ready", onReadyShow);
      return () => {
        window.removeEventListener("beforeinstallprompt", onBIPEarly);
        window.removeEventListener("postspark:pwa-ready", onReadyShow);
        window.removeEventListener("postspark:pwa-ready", onReady);
      };
    }

    // Capability check — already installed / standalone
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      window.matchMedia?.("(display-mode: minimal-ui)").matches ||
      // @ts-ignore iOS Safari
      window.navigator.standalone === true ||
      document.referrer.startsWith("android-app://");
    if (isStandalone) return;

    // Skip in iframe (Lovable preview)
    try {
      if (window.self !== window.top) return;
    } catch {
      return;
    }

    // Skip if browser already reports the related installed app
    const nav = window.navigator as any;
    if (typeof nav.getInstalledRelatedApps === "function") {
      nav.getInstalledRelatedApps().then((apps: unknown[]) => {
        if (apps && apps.length > 0) {
          localStorage.setItem(STORAGE_KEY, "installed");
        }
      }).catch(() => {});
    }

    const state = localStorage.getItem(STORAGE_KEY);
    if (state === "dismissed" || state === "installed") return;

    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    const isAndroid = /Android/.test(ua);
    const isChromiumDesktop =
      /Chrome|Edg|OPR/.test(ua) && !/Mobile/.test(ua) && !/Firefox/.test(ua);

    // Capability gate: only browsers with real install UI support
    const supportsInstallUI = isIOS || isAndroid || isChromiumDesktop;
    if (!supportsInstallUI) return;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      localStorage.setItem(STORAGE_KEY, "installed");
      setVisible(false);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);

    // iOS has no beforeinstallprompt — show manual hint
    let iosTimer: ReturnType<typeof setTimeout> | null = null;
    if (isIOS) {
      iosTimer = setTimeout(() => {
        setIosHint(true);
        setVisible(true);
      }, 1500);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "dismissed");
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    localStorage.setItem(STORAGE_KEY, outcome === "accepted" ? "installed" : "dismissed");
    setVisible(false);
    setDeferred(null);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-fade-in md:left-auto md:right-4">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl gradient-electric">
            <Download className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              Add PostSpark to your home screen
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {iosHint
                ? "Tap Share → Add to Home Screen for faster access."
                : "Install for faster access and a full-screen experience."}
            </p>
            <div className="mt-3 flex gap-2">
              {!iosHint && (
                <button
                  onClick={install}
                  className="rounded-lg gradient-electric px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  Install
                </button>
              )}
              <button
                onClick={dismiss}
                className="rounded-lg border border-input px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
