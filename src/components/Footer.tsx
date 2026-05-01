import { PostSparkLogo } from "@/components/PostSparkLogo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <PostSparkLogo variant="wordmark" size={32} />
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          © 2026 PostSpark. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
