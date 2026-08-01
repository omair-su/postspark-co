import type { ReactNode } from "react";
import { useSpotlight } from "@/hooks/useSpotlight";

/** Card with a pointer-tracked spotlight highlight and hover lift. */
export function SpotlightCard({
  children,
  className = "",
  accent = "#7C3AED",
  as: Tag = "div",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  accent?: string;
  as?: any;
} & Record<string, any>) {
  const { onPointerMove } = useSpotlight();
  return (
    <Tag
      {...rest}
      onPointerMove={onPointerMove}
      style={{ ["--cat" as any]: accent, ...(rest.style || {}) }}
      className={`ps-spot ps-lift ${className}`}
    >
      {children}
    </Tag>
  );
}
