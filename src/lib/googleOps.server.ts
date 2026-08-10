/**
 * Google Drive + Docs operations (server-only).
 * Every call goes through `withGoogle` so a 401 triggers exactly one refresh
 * retry before we surface GOOGLE_REAUTH_REQUIRED to the UI.
 */
import {
  DOCS_API,
  DRIVE_API,
  GOOGLE_IMPORT_MIME_TYPES,
  POSTSPARK_FOLDER_NAME,
} from "./google.server";
import {
  forceRefreshGoogleToken,
  getGoogleAccessToken,
  GOOGLE_REAUTH_REQUIRED,
} from "./googleAccount.server";

async function withGoogle<T>(
  userId: string,
  run: (token: string) => Promise<Response>,
  parse: (res: Response) => Promise<T>,
): Promise<T> {
  const first = await getGoogleAccessToken(userId);
  if (!first.token) throw new Error(first.error || GOOGLE_REAUTH_REQUIRED);

  let res = await run(first.token);
  if (res.status === 401 || res.status === 403) {
    const retry = await forceRefreshGoogleToken(userId);
    if (!retry.token) throw new Error(GOOGLE_REAUTH_REQUIRED);
    res = await run(retry.token);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[google] request failed [${res.status}]: ${body}`);
    if (res.status === 401) throw new Error(GOOGLE_REAUTH_REQUIRED);
    if (res.status === 403 && /insufficient/i.test(body)) throw new Error(GOOGLE_REAUTH_REQUIRED);
    if (res.status === 404) throw new Error("That file could not be found in your Drive.");
    if (res.status === 429) throw new Error("Google rate limit hit — try again in a moment.");
    throw new Error(`Google request failed (${res.status}).`);
  }
  return parse(res);
}

const j = (res: Response) => res.json() as Promise<any>;
const t = (res: Response) => res.text();

/* ── Drive browsing ────────────────────────────────────────────────── */

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  iconLink?: string;
  webViewLink?: string;
  isFolder: boolean;
}

const FILE_FIELDS = "nextPageToken, files(id,name,mimeType,modifiedTime,size,iconLink,webViewLink)";

export async function listDriveFiles(
  userId: string,
  opts: {
    search?: string;
    folderId?: string | null;
    pageToken?: string | null;
    pageSize?: number;
    foldersOnly?: boolean;
  } = {},
): Promise<{ files: DriveFile[]; nextPageToken: string | null }> {
  const clauses = ["trashed = false"];

  if (opts.foldersOnly) {
    clauses.push("mimeType = 'application/vnd.google-apps.folder'");
  } else {
    const mimes = GOOGLE_IMPORT_MIME_TYPES.map((m) => `mimeType = '${m}'`).join(" or ");
    clauses.push(`(mimeType = 'application/vnd.google-apps.folder' or ${mimes})`);
  }
  if (opts.search?.trim()) {
    clauses.push(`name contains '${opts.search.trim().replace(/'/g, "\\'")}'`);
  } else if (opts.folderId) {
    clauses.push(`'${opts.folderId}' in parents`);
  }

  const params = new URLSearchParams({
    q: clauses.join(" and "),
    fields: FILE_FIELDS,
    pageSize: String(Math.min(opts.pageSize ?? 50, 100)),
    orderBy: "folder,modifiedTime desc",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });
  if (opts.pageToken) params.set("pageToken", opts.pageToken);

  const data = await withGoogle(
    userId,
    (token) =>
      fetch(`${DRIVE_API}/files?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    j,
  );

  return {
    files: (data.files ?? []).map((f: any) => ({
      ...f,
      isFolder: f.mimeType === "application/vnd.google-apps.folder",
    })),
    nextPageToken: data.nextPageToken ?? null,
  };
}

export async function getDriveFileMeta(userId: string, fileId: string): Promise<DriveFile> {
  const data = await withGoogle(
    userId,
    (token) =>
      fetch(
        `${DRIVE_API}/files/${fileId}?fields=id,name,mimeType,modifiedTime,size,webViewLink&supportsAllDrives=true`,
        { headers: { Authorization: `Bearer ${token}` } },
      ),
    j,
  );
  return { ...data, isFolder: data.mimeType === "application/vnd.google-apps.folder" };
}

/* ── Text extraction ───────────────────────────────────────────────── */

/** Drive/Docs file → plain text usable as a PostSpark content source. */
export async function extractDriveFileText(
  userId: string,
  fileId: string,
): Promise<{ title: string; text: string; mimeType: string; webViewLink?: string }> {
  const meta = await getDriveFileMeta(userId, fileId);
  if (meta.isFolder) throw new Error("That's a folder — pick a document instead.");

  let text = "";

  if (meta.mimeType === "application/vnd.google-apps.document") {
    // Native Google Doc → export as plain text (keeps ordering, drops styling).
    text = await withGoogle(
      userId,
      (token) =>
        fetch(`${DRIVE_API}/files/${fileId}/export?mimeType=text/plain`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      t,
    );
  } else if (
    meta.mimeType === "text/plain" ||
    meta.mimeType === "text/markdown" ||
    meta.mimeType.startsWith("text/")
  ) {
    text = await withGoogle(
      userId,
      (token) =>
        fetch(`${DRIVE_API}/files/${fileId}?alt=media&supportsAllDrives=true`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      t,
    );
  } else if (
    meta.mimeType === "application/pdf" ||
    meta.mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    // Convert to a temporary Google Doc, export text, then clean up.
    const copy = await withGoogle(
      userId,
      (token) =>
        fetch(`${DRIVE_API}/files/${fileId}/copy?supportsAllDrives=true&fields=id`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `postspark-tmp-${Date.now()}`,
            mimeType: "application/vnd.google-apps.document",
          }),
        }),
      j,
    );
    try {
      text = await withGoogle(
        userId,
        (token) =>
          fetch(`${DRIVE_API}/files/${copy.id}/export?mimeType=text/plain`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        t,
      );
    } finally {
      await withGoogle(
        userId,
        (token) =>
          fetch(`${DRIVE_API}/files/${copy.id}?supportsAllDrives=true`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }),
        async () => null,
      ).catch(() => null);
    }
  } else {
    throw new Error(`Unsupported file type: ${meta.mimeType}`);
  }

  const cleaned = text.replace(/\uFEFF/g, "").replace(/\r\n/g, "\n").trim();
  if (!cleaned) throw new Error("That document appears to be empty.");
  return { title: meta.name, text: cleaned, mimeType: meta.mimeType, webViewLink: meta.webViewLink };
}

/* ── Doc creation (markdown-aware) ─────────────────────────────────── */

async function ensurePostSparkFolder(userId: string): Promise<string | null> {
  try {
    const q = `mimeType = 'application/vnd.google-apps.folder' and name = '${POSTSPARK_FOLDER_NAME}' and trashed = false`;
    const found = await withGoogle(
      userId,
      (token) =>
        fetch(`${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id)&pageSize=1`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      j,
    );
    if (found.files?.[0]?.id) return found.files[0].id;

    const created = await withGoogle(
      userId,
      (token) =>
        fetch(`${DRIVE_API}/files?fields=id`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            name: POSTSPARK_FOLDER_NAME,
            mimeType: "application/vnd.google-apps.folder",
          }),
        }),
      j,
    );
    return created.id ?? null;
  } catch {
    return null; // fall back to Drive root
  }
}

interface Block {
  text: string;
  heading?: 1 | 2 | 3;
  bullet?: boolean;
  bolds: Array<{ start: number; end: number }>;
}

/** Minimal markdown → block list (headings, bullets, **bold**). */
function parseMarkdown(md: string): Block[] {
  const blocks: Block[] = [];
  for (const rawLine of md.replace(/\r\n/g, "\n").split("\n")) {
    let line = rawLine.trimEnd();
    let heading: 1 | 2 | 3 | undefined;
    let bullet = false;

    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      heading = h[1].length as 1 | 2 | 3;
      line = h[2];
    } else if (/^\s*([-*•]|\d+[.)])\s+/.test(line)) {
      bullet = true;
      line = line.replace(/^\s*([-*•]|\d+[.)])\s+/, "");
    }

    // Strip **bold** / __bold__ markers, recording offsets for updateTextStyle.
    const bolds: Array<{ start: number; end: number }> = [];
    let text = "";
    let i = 0;
    while (i < line.length) {
      const marker = line.startsWith("**", i) ? "**" : line.startsWith("__", i) ? "__" : null;
      if (marker) {
        const close = line.indexOf(marker, i + 2);
        if (close > i + 2) {
          const inner = line.slice(i + 2, close);
          bolds.push({ start: text.length, end: text.length + inner.length });
          text += inner;
          i = close + 2;
          continue;
        }
      }
      text += line[i];
      i += 1;
    }
    blocks.push({ text, heading, bullet, bolds });
  }
  // collapse trailing blank blocks
  while (blocks.length && !blocks[blocks.length - 1].text.trim()) blocks.pop();
  return blocks;
}

export async function createGoogleDoc(
  userId: string,
  args: { title: string; content: string; folderId?: string | null },
): Promise<{ documentId: string; url: string; title: string }> {
  const title = args.title.trim().slice(0, 180) || "PostSpark Export";

  const doc = await withGoogle(
    userId,
    (token) =>
      fetch(`${DOCS_API}/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      }),
    j,
  );
  const documentId: string = doc.documentId;

  const blocks = parseMarkdown(args.content);
  const requests: any[] = [];
  let index = 1; // Docs body content starts at index 1

  for (const block of blocks) {
    const body = `${block.text}\n`;
    requests.push({ insertText: { location: { index }, text: body } });
    const start = index;
    const end = index + block.text.length;

    if (block.heading) {
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: start, endIndex: end + 1 },
          paragraphStyle: { namedStyleType: `HEADING_${block.heading}` },
          fields: "namedStyleType",
        },
      });
    }
    if (block.bullet && block.text.trim()) {
      requests.push({
        createParagraphBullets: {
          range: { startIndex: start, endIndex: end + 1 },
          bulletPreset: "BULLET_DISC_CIRCLE_SQUARE",
        },
      });
    }
    for (const b of block.bolds) {
      if (b.end > b.start) {
        requests.push({
          updateTextStyle: {
            range: { startIndex: start + b.start, endIndex: start + b.end },
            textStyle: { bold: true },
            fields: "bold",
          },
        });
      }
    }
    index = end + 1;
  }

  if (requests.length) {
    await withGoogle(
      userId,
      (token) =>
        fetch(`${DOCS_API}/documents/${documentId}:batchUpdate`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ requests }),
        }),
      j,
    );
  }

  // Move into the PostSpark Exports folder (best-effort).
  const folderId = args.folderId ?? (await ensurePostSparkFolder(userId));
  if (folderId) {
    await withGoogle(
      userId,
      (token) =>
        fetch(
          `${DRIVE_API}/files/${documentId}?addParents=${folderId}&removeParents=root&fields=id&supportsAllDrives=true`,
          { method: "PATCH", headers: { Authorization: `Bearer ${token}` } },
        ),
      j,
    ).catch(() => null);
  }

  return {
    documentId,
    url: `https://docs.google.com/document/d/${documentId}/edit`,
    title,
  };
}

/** Replace the whole body of an existing doc with new content. */
export async function replaceGoogleDocContent(
  userId: string,
  documentId: string,
  content: string,
): Promise<{ documentId: string; url: string }> {
  const current = await withGoogle(
    userId,
    (token) =>
      fetch(`${DOCS_API}/documents/${documentId}?fields=body.content`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    j,
  );
  const last = (current.body?.content ?? []).slice(-1)[0];
  const endIndex = Math.max((last?.endIndex ?? 2) - 1, 1);

  const requests: any[] = [];
  if (endIndex > 1) {
    requests.push({ deleteContentRange: { range: { startIndex: 1, endIndex } } });
  }
  requests.push({ insertText: { location: { index: 1 }, text: `${content.trim()}\n` } });

  await withGoogle(
    userId,
    (token) =>
      fetch(`${DOCS_API}/documents/${documentId}:batchUpdate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ requests }),
      }),
    j,
  );

  return { documentId, url: `https://docs.google.com/document/d/${documentId}/edit` };
}
