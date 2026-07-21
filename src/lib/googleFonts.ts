// Curated list of top Google Fonts + client-side loader.
// Uses Google Fonts CSS2 API — no API key required.

export type FontCategory = "sans-serif" | "serif" | "display" | "monospace" | "handwriting";

export interface GoogleFont {
  family: string;
  category: FontCategory;
  weights?: string; // "wght@400;600;700"
}

// ~100 hand-curated top fonts, categorized.
export const GOOGLE_FONTS: GoogleFont[] = [
  // Sans
  { family: "Inter", category: "sans-serif", weights: "wght@400;500;600;700" },
  { family: "Poppins", category: "sans-serif", weights: "wght@400;500;600;700" },
  { family: "Montserrat", category: "sans-serif", weights: "wght@400;500;600;700" },
  { family: "Roboto", category: "sans-serif", weights: "wght@400;500;700" },
  { family: "Open Sans", category: "sans-serif", weights: "wght@400;600;700" },
  { family: "Lato", category: "sans-serif", weights: "wght@400;700" },
  { family: "Nunito", category: "sans-serif", weights: "wght@400;600;700" },
  { family: "Nunito Sans", category: "sans-serif", weights: "wght@400;600;700" },
  { family: "Work Sans", category: "sans-serif", weights: "wght@400;500;600;700" },
  { family: "DM Sans", category: "sans-serif", weights: "wght@400;500;700" },
  { family: "Plus Jakarta Sans", category: "sans-serif", weights: "wght@400;500;600;700" },
  { family: "Space Grotesk", category: "sans-serif", weights: "wght@400;500;700" },
  { family: "Manrope", category: "sans-serif", weights: "wght@400;500;600;700" },
  { family: "Outfit", category: "sans-serif", weights: "wght@400;500;600;700" },
  { family: "Figtree", category: "sans-serif", weights: "wght@400;500;600;700" },
  { family: "Sora", category: "sans-serif", weights: "wght@400;500;600;700" },
  { family: "Urbanist", category: "sans-serif", weights: "wght@400;500;600;700" },
  { family: "Rubik", category: "sans-serif", weights: "wght@400;500;600;700" },
  { family: "Karla", category: "sans-serif", weights: "wght@400;500;700" },
  { family: "Barlow", category: "sans-serif", weights: "wght@400;500;600;700" },
  { family: "Mulish", category: "sans-serif", weights: "wght@400;600;700" },
  { family: "Kanit", category: "sans-serif", weights: "wght@400;500;600;700" },
  { family: "Cabin", category: "sans-serif", weights: "wght@400;500;600;700" },
  { family: "Hind", category: "sans-serif", weights: "wght@400;500;600;700" },
  { family: "PT Sans", category: "sans-serif", weights: "wght@400;700" },
  { family: "Source Sans 3", category: "sans-serif", weights: "wght@400;600;700" },
  { family: "IBM Plex Sans", category: "sans-serif", weights: "wght@400;500;600;700" },
  { family: "Fira Sans", category: "sans-serif", weights: "wght@400;500;600;700" },
  { family: "Titillium Web", category: "sans-serif", weights: "wght@400;600;700" },
  { family: "Archivo", category: "sans-serif", weights: "wght@400;500;600;700" },
  { family: "Jost", category: "sans-serif", weights: "wght@400;500;600;700" },
  { family: "Epilogue", category: "sans-serif", weights: "wght@400;500;600;700" },
  { family: "Onest", category: "sans-serif", weights: "wght@400;500;600;700" },
  { family: "Geist", category: "sans-serif", weights: "wght@400;500;600;700" },

  // Serif
  { family: "Playfair Display", category: "serif", weights: "wght@400;500;700" },
  { family: "Merriweather", category: "serif", weights: "wght@400;700" },
  { family: "Lora", category: "serif", weights: "wght@400;500;600;700" },
  { family: "PT Serif", category: "serif", weights: "wght@400;700" },
  { family: "Source Serif 4", category: "serif", weights: "wght@400;600;700" },
  { family: "Crimson Pro", category: "serif", weights: "wght@400;600;700" },
  { family: "Cormorant Garamond", category: "serif", weights: "wght@400;500;600;700" },
  { family: "EB Garamond", category: "serif", weights: "wght@400;500;600;700" },
  { family: "Libre Baskerville", category: "serif", weights: "wght@400;700" },
  { family: "Bitter", category: "serif", weights: "wght@400;500;600;700" },
  { family: "Roboto Slab", category: "serif", weights: "wght@400;500;700" },
  { family: "Noto Serif", category: "serif", weights: "wght@400;700" },
  { family: "DM Serif Display", category: "serif" },
  { family: "Instrument Serif", category: "serif" },
  { family: "Fraunces", category: "serif", weights: "wght@400;500;600;700" },
  { family: "Spectral", category: "serif", weights: "wght@400;500;600;700" },
  { family: "Cardo", category: "serif", weights: "wght@400;700" },
  { family: "Vollkorn", category: "serif", weights: "wght@400;500;600;700" },
  { family: "Tinos", category: "serif", weights: "wght@400;700" },

  // Display
  { family: "Bebas Neue", category: "display" },
  { family: "Anton", category: "display" },
  { family: "Oswald", category: "display", weights: "wght@400;500;600;700" },
  { family: "Righteous", category: "display" },
  { family: "Fredoka", category: "display", weights: "wght@400;500;600;700" },
  { family: "Archivo Black", category: "display" },
  { family: "Abril Fatface", category: "display" },
  { family: "Bungee", category: "display" },
  { family: "Syne", category: "display", weights: "wght@400;600;700" },
  { family: "Unica One", category: "display" },
  { family: "Cinzel", category: "display", weights: "wght@400;600;700" },
  { family: "Alfa Slab One", category: "display" },
  { family: "Big Shoulders Display", category: "display", weights: "wght@400;600;700" },
  { family: "Chakra Petch", category: "display", weights: "wght@400;500;600;700" },
  { family: "Orbitron", category: "display", weights: "wght@400;500;600;700" },
  { family: "Audiowide", category: "display" },
  { family: "Bruno Ace SC", category: "display" },
  { family: "Josefin Sans", category: "display", weights: "wght@400;500;600;700" },

  // Monospace
  { family: "JetBrains Mono", category: "monospace", weights: "wght@400;500;700" },
  { family: "Fira Code", category: "monospace", weights: "wght@400;500;700" },
  { family: "Source Code Pro", category: "monospace", weights: "wght@400;500;700" },
  { family: "IBM Plex Mono", category: "monospace", weights: "wght@400;500;600;700" },
  { family: "Space Mono", category: "monospace", weights: "wght@400;700" },
  { family: "Roboto Mono", category: "monospace", weights: "wght@400;500;700" },
  { family: "Ubuntu Mono", category: "monospace", weights: "wght@400;700" },
  { family: "Inconsolata", category: "monospace", weights: "wght@400;500;700" },

  // Handwriting / script accents
  { family: "Pacifico", category: "handwriting" },
  { family: "Dancing Script", category: "handwriting", weights: "wght@400;600;700" },
  { family: "Caveat", category: "handwriting", weights: "wght@400;600;700" },
  { family: "Sacramento", category: "handwriting" },
  { family: "Great Vibes", category: "handwriting" },
];

// Curated pairings (heading → suggested body fonts)
export const FONT_PAIRINGS: Record<string, string[]> = {
  "Playfair Display": ["Inter", "Source Sans 3", "Lato"],
  "Fraunces": ["Inter", "Manrope", "DM Sans"],
  "Instrument Serif": ["Inter", "Plus Jakarta Sans", "DM Sans"],
  "DM Serif Display": ["DM Sans", "Inter", "Work Sans"],
  "Bebas Neue": ["Inter", "Barlow", "Karla"],
  "Anton": ["Roboto", "Work Sans", "Nunito"],
  "Space Grotesk": ["DM Sans", "Inter", "Manrope"],
  "Syne": ["Inter", "DM Sans", "Manrope"],
  "Poppins": ["Inter", "Open Sans", "Lato"],
  "Montserrat": ["Merriweather", "Lora", "Open Sans"],
  "Inter": ["Inter", "IBM Plex Sans", "Source Sans 3"],
  "Cinzel": ["Lato", "Nunito", "Karla"],
  "Abril Fatface": ["Lato", "Poppins", "Work Sans"],
  "Oswald": ["Open Sans", "Roboto", "Lato"],
  "Orbitron": ["JetBrains Mono", "IBM Plex Mono", "Inter"],
  "Sora": ["Inter", "DM Sans", "Manrope"],
};

const loadedFamilies = new Set<string>();

/** Inject a Google Fonts CSS2 link for a family — idempotent. */
export function loadGoogleFont(family: string, weights?: string) {
  if (typeof document === "undefined") return;
  const key = `${family}:${weights || ""}`;
  if (loadedFamilies.has(key)) return;
  loadedFamilies.add(key);
  const encoded = family.replace(/ /g, "+");
  const wt = weights ? `:${weights}` : "";
  const href = `https://fonts.googleapis.com/css2?family=${encoded}${wt}&display=swap`;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.setAttribute("data-google-font", family);
  document.head.appendChild(link);
}

/** Bulk-preload a batch of families for a searchable font list. */
export function preloadFonts(fonts: GoogleFont[]) {
  for (const f of fonts) loadGoogleFont(f.family, f.weights);
}

/** Inject an @font-face rule for a user-uploaded custom font. */
export function registerCustomFont(family: string, url: string, format = "woff2") {
  if (typeof document === "undefined") return;
  const key = `custom:${family}`;
  if (loadedFamilies.has(key)) return;
  loadedFamilies.add(key);
  const style = document.createElement("style");
  style.setAttribute("data-custom-font", family);
  style.textContent = `@font-face { font-family: "${family}"; src: url("${url}") format("${format}"); font-display: swap; }`;
  document.head.appendChild(style);
}

export function detectFontFormat(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (ext === "woff2") return "woff2";
  if (ext === "woff") return "woff";
  if (ext === "otf") return "opentype";
  return "truetype";
}
