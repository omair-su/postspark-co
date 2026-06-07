import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY = "ps_pwa_prompt_state_v1";

export function PWAInstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Capability checks
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      window.matchMedia?.("(display-mode: minimal-ui)").matches ||
      // @ts-ignore iOS Safari
      window.navigator.standalone === true ||
      document.referrer.startsWith("android-app://");
    if (isStandalone) return;

    try {
      if (window.self !== window.top) return;
    } catch {
      return;
    }

    const nav = window.navigator as any;
    if (typeof nav.getInstalledRelatedApps === "function") {
      nav.getInstalledRelatedApps().then((apps: unknown[]) => {
        if (apps && apps.length > 0) localStorage.setItem(STORAGE_KEY, "installed");
      }).catch(() => {});
    }

    const state = localStorage.getItem(STORAGE_KEY);
    if (state === "dismissed" || state === "installed") return;

    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    const isAndroid = /Android/.test(ua);
    const isChromiumDesktop = /Chrome|Edg|OPR/.test(ua) && !/Mobile/.test(ua) && !/Firefox/.test(ua);
    if (!(isIOS || isAndroid || isChromiumDesktop)) return;

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
