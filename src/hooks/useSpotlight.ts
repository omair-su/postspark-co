import { useCallback } from "react";

/**
 * Pointer-tracked spotlight. Attach the returned handler to any element
 * carrying the `ps-spot` class; it writes --mx / --my custom properties.
 */
export function useSpotlight() {
  const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  }, []);

  return { onPointerMove };
}
