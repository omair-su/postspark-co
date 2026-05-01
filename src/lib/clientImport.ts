// Browser-only helpers — never import in server code.

export async function extractPdfText(file: File): Promise<string> {
  const pdfjs: any = await import("pdfjs-dist");
  // Use the bundled worker via Vite's worker URL handling.
  // @ts-ignore
  const workerSrc = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  let out = "";
  const max = Math.min(pdf.numPages, 200);
  for (let i = 1; i <= max; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str);
    out += strings.join(" ") + "\n\n";
  }
  return out.trim();
}

export async function extractDocxText(file: File): Promise<string> {
  const mammoth: any = await import("mammoth/mammoth.browser.js");
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return (result.value || "").trim();
}

export async function fileToBase64(file: Blob): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(",");
      resolve({
        base64: result.slice(comma + 1),
        mimeType: file.type || "audio/webm",
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
