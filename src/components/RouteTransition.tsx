/**
 * Cinematic view transition wrapper.
 *
 * Intentionally NOT keyed on pathname: keying here remounted the whole routed
 * tree (including the dashboard shell/sidebar) on every navigation, resetting
 * state and re-firing server calls. Individual layouts (e.g. DashboardLayout)
 * key their own inner content wrapper to play the enter animation.
 * Motion is fully disabled under prefers-reduced-motion (see styles.css).
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  return <div className="lux-view">{children}</div>;
}
