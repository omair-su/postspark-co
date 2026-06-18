import type { LucideIcon } from "lucide-react";

interface LuxIconCardProps {
  icon: LucideIcon;
  size?: number;
  tone?: "primary" | "gold";
}

export function LuxIconCard({ icon: Icon, size = 72, tone = "primary" }: LuxIconCardProps) {
  const iconColor = tone === "gold" ? "#C9A87C" : "#7C3AED";
  const haloColor = tone === "gold" ? "rgba(201,168,124,0.18)" : "rgba(233,213,255,0.7)";
  const shadowColor = tone === "gold" ? "rgba(201,168,124,0.14)" : "rgba(124,58,237,0.12)";

  return (
    <>
      <style>{`
        .lux-icon-card {
          transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease;
        }
        .lux-icon-card:hover {
          transform: perspective(800px) rotateX(-4deg) rotateY(4deg) scale(1.04);
          box-shadow: 0 16px 32px ${shadowColor}, inset 0 1.5px 0 rgba(255,255,255,0.9) !important;
        }
      `}</style>
      <div
        className="lux-icon-card flex items-center justify-center rounded-2xl shrink-0"
        style={{
          width: size,
          height: size,
          background: "linear-gradient(145deg, #F5F3FF 0%, #FFFFFF 100%)",
          boxShadow: `0 8px 20px ${shadowColor}, inset 0 1.5px 0 rgba(255,255,255,0.85)`,
          position: "relative",
        }}
      >
        {/* Halo behind icon */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            background: `radial-gradient(circle at 50% 55%, ${haloColor} 0%, transparent 70%)`,
          }}
        />
        <Icon size={size * 0.42} color={iconColor} style={{ position: "relative", zIndex: 1 }} strokeWidth={1.8} />
      </div>
    </>
  );
}
