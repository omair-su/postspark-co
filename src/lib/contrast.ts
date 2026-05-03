// WCAG 2.1 contrast utilities
function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([a-fA-F0-9]{6})$/.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relLum([r, g, b]: [number, number, number]): number {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(fg: string, bg: string): number {
  const a = hexToRgb(fg);
  const b = hexToRgb(bg);
  if (!a || !b) return 1;
  const l1 = relLum(a);
  const l2 = relLum(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export type ContrastGrade = {
  ratio: number;
  aaNormal: boolean; // 4.5
  aaLarge: boolean; // 3
  aaaNormal: boolean; // 7
  label: "Fail" | "AA Large" | "AA" | "AAA";
};

export function gradeContrast(fg: string, bg: string): ContrastGrade {
  const ratio = contrastRatio(fg, bg);
  const aaLarge = ratio >= 3;
  const aaNormal = ratio >= 4.5;
  const aaaNormal = ratio >= 7;
  let label: ContrastGrade["label"] = "Fail";
  if (aaaNormal) label = "AAA";
  else if (aaNormal) label = "AA";
  else if (aaLarge) label = "AA Large";
  return { ratio, aaNormal, aaLarge, aaaNormal, label };
}
