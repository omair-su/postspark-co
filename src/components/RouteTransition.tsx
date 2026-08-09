import { useLocation } from "@tanstack/react-router";

/**
 * Cinematic view transition wrapper.
 * Keyed on pathname so every route (marketing, tools, features, dashboard,
 * settings, history) re-mounts and plays the same enter timing.
 * Motion is fully disabled under prefers-reduced-motion (see styles.css).
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="lux-view">
      {children}
    </div>
  );
}
