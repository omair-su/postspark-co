// Curated brand palette presets — Primary / Secondary / Accent / Neutral / Background.

export interface PalettePreset {
  id: string;
  label: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    neutral: string;
    background: string;
  };
}

export const PALETTE_PRESETS: PalettePreset[] = [
  {
    id: "electric-saas",
    label: "Electric SaaS",
    description: "Deep violet + electric accent — Linear / Cursor energy.",
    colors: {
      primary: "#7c3aed",
      secondary: "#1a1a2e",
      accent: "#22d3ee",
      neutral: "#e2e8f0",
      background: "#0b1020",
    },
  },
  {
    id: "neon-cyber",
    label: "Neon Cyber",
    description: "Magenta + cyan on midnight — cyberpunk-lite.",
    colors: {
      primary: "#d946ef",
      secondary: "#0f0a1f",
      accent: "#22d3ee",
      neutral: "#cbd5e1",
      background: "#050418",
    },
  },
  {
    id: "warm-luxury",
    label: "Warm Luxury",
    description: "Cream, oxblood, gold — editorial luxury.",
    colors: {
      primary: "#7f1d1d",
      secondary: "#1c1917",
      accent: "#d4a24c",
      neutral: "#f5f0e6",
      background: "#faf7f2",
    },
  },
  {
    id: "minimalist",
    label: "Minimalist",
    description: "Ink on paper — pure typography focus.",
    colors: {
      primary: "#111827",
      secondary: "#374151",
      accent: "#0ea5e9",
      neutral: "#e5e7eb",
      background: "#ffffff",
    },
  },
  {
    id: "pastel-creative",
    label: "Pastel Creative",
    description: "Soft peach + sage — creator-friendly warmth.",
    colors: {
      primary: "#f472b6",
      secondary: "#fef3c7",
      accent: "#34d399",
      neutral: "#fef2f2",
      background: "#fffbf5",
    },
  },
  {
    id: "modern-tech",
    label: "Modern Tech",
    description: "Cobalt + slate — stripe-adjacent professionalism.",
    colors: {
      primary: "#2563eb",
      secondary: "#0f172a",
      accent: "#22d3ee",
      neutral: "#f1f5f9",
      background: "#f8fafc",
    },
  },
];
