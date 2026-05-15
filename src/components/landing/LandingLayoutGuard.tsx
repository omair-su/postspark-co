import { useEffect } from "react";

/**
 * Dev-only regression check: warns in the console if any landing <section>
 * overflows the viewport horizontally at common breakpoints, or shifts on
 * resize. Helps catch creamy-luxury sections (TrustedBy, Before/After,
 * Features, Pricing, etc.) clipping or causing horizontal scroll.
 */
export function LandingLayoutGuard() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (import.meta.env.PROD) return;

    const check = () => {
      const vw = window.innerWidth;
      const docW = document.documentElement.scrollWidth;
      if (docW > vw + 1) {
        // eslint-disable-next-line no-console
        console.warn(
          `[LandingLayoutGuard] Horizontal overflow: document=${docW}px > viewport=${vw}px`
        );
      }
      const sections = document.querySelectorAll("main section, body section");
      sections.forEach((s) => {
        const rect = (s as HTMLElement).getBoundingClientRect();
        if (rect.width > vw + 1) {
          // eslint-disable-next-line no-console
          console.warn(
            `[LandingLayoutGuard] Section wider than viewport (${Math.round(
              rect.width
            )}px > ${vw}px):`,
            s
          );
        }
        if (rect.left < -1 || rect.right > vw + 1) {
          // eslint-disable-next-line no-console
          console.warn(
            `[LandingLayoutGuard] Section clipped at edges (left=${Math.round(
              rect.left
            )}, right=${Math.round(rect.right)}):`,
            s
          );
        }
      });
    };

    const id = window.setTimeout(check, 600);
    window.addEventListener("resize", check);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("resize", check);
    };
  }, []);

  return null;
}
