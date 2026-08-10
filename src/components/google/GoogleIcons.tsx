/** Official Google product marks — used across import/export surfaces. */

export function GoogleDriveIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 87.3 78" className={className} aria-hidden>
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47" />
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335" />
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
    </svg>
  );
}

export function GoogleDocsIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 64" className={className} aria-hidden>
      <path d="M30 0H6a6 6 0 0 0-6 6v52a6 6 0 0 0 6 6h36a6 6 0 0 0 6-6V18z" fill="#4285f4" />
      <path d="M30 0v12a6 6 0 0 0 6 6h12z" fill="#a1c2fa" />
      <path d="M12 30h24v4H12zm0 8h24v4H12zm0 8h16v4H12z" fill="#fff" />
    </svg>
  );
}

export function GoogleGIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden>
      <path fill="#4285f4" d="M45 24c0-1.6-.1-2.7-.4-4H24v8h12c-.3 2-1.6 5-4.4 7l6.7 5.2C42.2 36.3 45 30.7 45 24z" />
      <path fill="#34a853" d="M24 46c5.9 0 10.9-2 14.3-5.3l-6.7-5.2C29.8 36.7 27.2 37.5 24 37.5c-5.8 0-10.7-3.8-12.5-9.1l-7 5.4C8 40.6 15.4 46 24 46z" />
      <path fill="#fbbc04" d="M11.5 28.4c-.5-1.4-.7-2.9-.7-4.4s.3-3 .7-4.4l-7-5.4C3.3 17 2.5 20.4 2.5 24s.8 7 2.5 9.8z" />
      <path fill="#ea4335" d="M24 10.5c3.3 0 6.2 1.1 8.5 3.3l6-6C34.8 4.4 29.9 2 24 2 15.4 2 8 7.4 5 15.2l7 5.4c1.8-5.3 6.7-10.1 12-10.1z" />
    </svg>
  );
}

/** Small colored glyph for a Drive mime type. */
export function DriveMimeIcon({ mimeType, size = 18 }: { mimeType: string; size?: number }) {
  if (mimeType === "application/vnd.google-apps.folder") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
        <path
          d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8z"
          fill="#5f6368"
          opacity="0.85"
        />
      </svg>
    );
  }
  if (mimeType === "application/pdf") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
        <path d="M6 2h8l6 6v14H6z" fill="#ea4335" />
        <path d="M14 2v6h6z" fill="#fbbcb3" />
      </svg>
    );
  }
  return <GoogleDocsIcon size={size} />;
}
