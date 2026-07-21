// Single-click PDF brand guide export. Reuses jspdf (already installed).
import jsPDF from "jspdf";
import type { LogoSlots } from "@/components/brandkit/LogoVault";

export interface BrandGuideData {
  brandName: string;
  handle?: string;
  tagline?: string;
  primary: string;
  secondary: string;
  accent: string;
  neutral?: string;
  background?: string;
  savedSwatches?: string[];
  fontHeading: string;
  fontBody: string;
  tone?: string;
  logos: LogoSlots;
}

function hexToRgbTuple(hex: string): [number, number, number] {
  const raw = hex.replace(/^#/, "");
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  const n = parseInt(full || "000000", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

async function loadImageDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function exportBrandGuide(data: BrandGuideData, filename = "brand-guide") {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;

  // ---------- Cover ----------
  const [pr, pg, pb] = hexToRgbTuple(data.primary);
  const [sr, sg, sb] = hexToRgbTuple(data.secondary);

  // Gradient-ish cover: fill secondary, then overlay primary band.
  doc.setFillColor(sr, sg, sb);
  doc.rect(0, 0, pageW, pageH, "F");
  doc.setFillColor(pr, pg, pb);
  doc.rect(0, pageH * 0.55, pageW, pageH * 0.45, "F");

  // Logo on cover
  const primaryLogo = data.logos.primary || data.logos.light || data.logos.mark;
  if (primaryLogo) {
    const dataUrl = await loadImageDataUrl(primaryLogo);
    if (dataUrl) {
      try {
        doc.addImage(dataUrl, "PNG", margin, margin, 30, 30, undefined, "FAST");
      } catch { /* skip on bad decode */ }
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.text(data.brandName || "Brand Guide", margin, pageH * 0.5);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  if (data.handle) doc.text(data.handle, margin, pageH * 0.5 + 8);
  if (data.tagline) {
    doc.setFontSize(14);
    const lines = doc.splitTextToSize(data.tagline, pageW - margin * 2);
    doc.text(lines, margin, pageH * 0.5 + 18);
  }
  doc.setFontSize(9);
  doc.text(`Generated ${new Date().toLocaleDateString()} · postspark.co`, margin, pageH - margin);

  // ---------- Logo variants ----------
  doc.addPage();
  drawHeader(doc, "Logo variants", pageW, margin);
  const slots: { key: keyof LogoSlots; label: string; bg: [number, number, number] }[] = [
    { key: "primary", label: "Primary logo", bg: [248, 250, 252] },
    { key: "mark", label: "Icon / mark", bg: [248, 250, 252] },
    { key: "light", label: "Light-background", bg: [255, 255, 255] },
    { key: "dark", label: "Dark-background", bg: [15, 23, 42] },
  ];
  const boxW = (pageW - margin * 2 - 10) / 2;
  const boxH = 60;
  let colX = margin, rowY = margin + 14;
  let col = 0;
  for (const s of slots) {
    const url = data.logos[s.key];
    doc.setFillColor(...s.bg);
    doc.rect(colX, rowY, boxW, boxH, "F");
    doc.setDrawColor(230, 230, 235);
    doc.rect(colX, rowY, boxW, boxH, "S");
    if (url) {
      const dataUrl = await loadImageDataUrl(url);
      if (dataUrl) {
        try {
          const imgW = 40, imgH = 30;
          doc.addImage(dataUrl, "PNG", colX + (boxW - imgW) / 2, rowY + (boxH - imgH - 8) / 2, imgW, imgH, undefined, "FAST");
        } catch { /* skip */ }
      }
    } else {
      doc.setTextColor(160, 160, 170);
      doc.setFontSize(9);
      doc.text("Not provided", colX + boxW / 2, rowY + boxH / 2, { align: "center" });
    }
    doc.setTextColor(50, 50, 60);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(s.label, colX + 2, rowY + boxH + 5);
    col++;
    if (col === 2) { col = 0; colX = margin; rowY += boxH + 12; }
    else { colX = margin + boxW + 10; }
  }

  // ---------- Color palette ----------
  doc.addPage();
  drawHeader(doc, "Color palette", pageW, margin);
  const swatches: { label: string; hex: string }[] = [
    { label: "Primary", hex: data.primary },
    { label: "Secondary", hex: data.secondary },
    { label: "Accent", hex: data.accent },
    ...(data.neutral ? [{ label: "Neutral", hex: data.neutral }] : []),
    ...(data.background ? [{ label: "Background", hex: data.background }] : []),
  ];
  const swW = (pageW - margin * 2 - 12) / 3;
  const swH = 42;
  colX = margin; rowY = margin + 14; col = 0;
  for (const sw of swatches) {
    const [r, g, b] = hexToRgbTuple(sw.hex);
    doc.setFillColor(r, g, b);
    doc.roundedRect(colX, rowY, swW, swH, 3, 3, "F");
    doc.setTextColor(50, 50, 60);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(sw.label, colX, rowY + swH + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 130);
    doc.text(sw.hex.toUpperCase(), colX, rowY + swH + 10);
    col++;
    if (col === 3) { col = 0; colX = margin; rowY += swH + 20; }
    else { colX += swW + 6; }
  }

  // Saved swatches
  if (data.savedSwatches && data.savedSwatches.length > 0) {
    rowY += 10;
    doc.setTextColor(50, 50, 60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Additional saved swatches", margin, rowY);
    rowY += 6;
    const tinyW = 12, tinyH = 12;
    let tx = margin;
    for (const s of data.savedSwatches) {
      if (tx + tinyW > pageW - margin) { tx = margin; rowY += tinyH + 8; }
      const [r, g, b] = hexToRgbTuple(s);
      doc.setFillColor(r, g, b);
      doc.roundedRect(tx, rowY, tinyW, tinyH, 2, 2, "F");
      doc.setTextColor(120, 120, 130);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text(s.toUpperCase(), tx, rowY + tinyH + 3);
      tx += tinyW + 8;
    }
  }

  // ---------- Typography ----------
  doc.addPage();
  drawHeader(doc, "Typography", pageW, margin);
  let ty = margin + 20;
  doc.setTextColor(120, 120, 130);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Heading font", margin, ty);
  ty += 5;
  doc.setTextColor(20, 20, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text(data.fontHeading || "Inter", margin, ty + 4);
  ty += 18;

  doc.setTextColor(120, 120, 130);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Body font", margin, ty);
  ty += 5;
  doc.setTextColor(20, 20, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(data.fontBody || "Inter", margin, ty + 4);
  ty += 16;

  doc.setTextColor(60, 60, 70);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const sampleLines = doc.splitTextToSize(
    "The quick brown fox jumps over the lazy dog. Almost every letter of the alphabet appears in this sentence — great for previewing a body typeface at real reading size.",
    pageW - margin * 2,
  );
  doc.text(sampleLines, margin, ty + 4);

  // ---------- Tone / voice ----------
  if (data.tone) {
    ty += sampleLines.length * 5 + 14;
    doc.setTextColor(120, 120, 130);
    doc.setFontSize(9);
    doc.text("Preferred tone", margin, ty);
    ty += 5;
    doc.setTextColor(20, 20, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(data.tone.charAt(0).toUpperCase() + data.tone.slice(1), margin, ty + 4);
  }

  // Footer on every page
  const pageCount = (doc as any).internal.getNumberOfPages() as number;
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setTextColor(160, 160, 170);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(`${data.brandName || "Brand Guide"} · ${p}/${pageCount}`, pageW - margin, pageH - 7, { align: "right" });
  }

  doc.save(`${filename}.pdf`);
}

function drawHeader(doc: jsPDF, title: string, pageW: number, margin: number) {
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, pageW, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("BRAND GUIDE", margin, 6.5);
  doc.setTextColor(20, 20, 30);
  doc.setFontSize(20);
  doc.text(title, margin, margin + 5);
  doc.setDrawColor(230, 230, 235);
  doc.line(margin, margin + 8, pageW - margin, margin + 8);
}
