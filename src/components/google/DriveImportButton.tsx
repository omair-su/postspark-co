import { useState } from "react";
import { toast } from "sonner";
import { GoogleDriveFilePicker } from "./GoogleDriveFilePicker";
import { GoogleDriveIcon } from "./GoogleIcons";
import { useGoogleStatus } from "./useGoogle";

export interface DriveImportButtonProps {
  /** Receives the extracted plain text (and the source document title). */
  onImported: (text: string, title: string) => void;
  label?: string;
  variant?: "inline" | "button";
  className?: string;
}

/** Small "Import from Drive" trigger + picker dialog, reusable on any tool page. */
export function DriveImportButton({
  onImported,
  label = "Import from Drive",
  variant = "inline",
  className = "",
}: DriveImportButtonProps) {
  const { status, connect } = useGoogleStatus();
  const [open, setOpen] = useState(false);

  if (!status?.configured) return null;

  const trigger = () => {
    if (!status.connected) {
      toast.info("Connect Google to import from Drive.");
      connect();
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={trigger}
        className={
          variant === "inline"
            ? `inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-all hover:border-primary hover:text-primary ${className}`
            : `inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground transition-all hover:border-primary hover:text-primary ${className}`
        }
      >
        <GoogleDriveIcon size={variant === "inline" ? 13 : 16} /> {label}
      </button>

      <GoogleDriveFilePicker
        open={open}
        onOpenChange={setOpen}
        onImported={({ text, title }) => onImported(text, title)}
      />
    </>
  );
}

export default DriveImportButton;
