import jsPDF from "jspdf";

interface ExportSection {
  title: string;
  content: string;
}

export function exportToPdf(sections: ExportSection[], filename = "repurpose-export") {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  const maxW = pageW - margin * 2;
  let y = margin;

  // Header
  doc.setFontSize(8);
  doc.setTextColor(124, 58, 237); // electric purple
  doc.text("PostSpark", margin, y);
  doc.setTextColor(160, 160, 170);
  doc.text(new Date().toLocaleDateString(), pageW - margin, y, { align: "right" });
  y += 10;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    // Section title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 26, 46); // navy
    const titleLines = doc.splitTextToSize(section.title, maxW);
    if (y + titleLines.length * 6 > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(titleLines, margin, y);
    y += titleLines.length * 6 + 3;

    // Divider
    doc.setDrawColor(230, 230, 235);
    doc.line(margin, y, pageW - margin, y);
    y += 5;

    // Content
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 60);
    const lines = doc.splitTextToSize(section.content, maxW);

    for (const line of lines) {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 5;
    }

    y += 8;
  }

  doc.save(`${filename}.pdf`);
}
