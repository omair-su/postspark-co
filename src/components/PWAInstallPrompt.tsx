import { useEffect, useRef, useState } from "react";
import { X, Download, Share } from "lucide-react";
import { track } from "@/lib/analytics";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY = "ps_pwa_prompt_state_v1";

type Mode = "native" | "ios" | "manual";

export function PWAInstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<Mode>("native");
  const shownTrackedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

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
      setMode("native");
      setVisible(true);
    };
    const onInstalled = () => {
      localStorage.setItem(STORAGE_KEY, "installed");
      track("pwa_installed");
      setVisible(false);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);

    // Fallback: show A2HS hint when native prompt isn't available
    // - iOS Safari (no beforeinstallprompt)
    // - Android/Chromium where criteria already passed (event already fired) or PWA already partially registered
    const fallbackTimer = setTimeout(() => {
      setVisible((prev) => {
        if (prev) return prev;
        setMode(isIOS ? "ios" : "manual");
        return true;
      });
    }, isIOS ? 1500 : 4000);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
      clearTimeout(fallbackTimer);
    };
  }, []);

  useEffect(() => {
    if (visible && !shownTrackedRef.current) {
      shownTrackedRef.current = true;
      track("pwa_install_prompt_shown", { mode });
    }
  }, [visible, mode]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "dismissed");
    track("pwa_install_prompt_dismissed", { mode });
    setVisible(false);
  };

  const install = async () => {
    track("pwa_install_prompt_clicked", { mode });
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    track("pwa_install_prompt_outcome", { mode, outcome });
    localStorage.setItem(STORAGE_KEY, outcome === "accepted" ? "installed" : "dismissed");
    setVisible(false);
    setDeferred(null);
  };

  if (!visible) return null;

  const isIos = mode === "ios";
  const isManual = mode === "manual";

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-fade-in md:left-auto md:right-4">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl gradient-electric">
            {isIos ? <Share className="h-5 w-5 text-primary-foreground" /> : <Download className="h-5 w-5 text-primary-foreground" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              Add PostSpark to your home screen
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isIos
                ? "Tap the Share icon in Safari, then choose “Add to Home Screen”."
                : isManual
                ? "Open your browser menu (⋮) and tap “Install app” or “Add to Home Screen”."
                : "Install for faster access and a full-screen experience."}
            </p>
            <div className="mt-3 flex gap-2">
              {mode === "native" && (
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
                {mode === "native" ? "Dismiss" : "Got it"}
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
