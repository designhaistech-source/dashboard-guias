export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>© {year} HaisGuias — Todos os direitos reservados.</p>
        <p>
          Uma iniciativa de{" "}
          <span className="font-medium text-foreground">HaisTech</span> e{" "}
          <span className="font-medium text-foreground">CAORN</span>.
        </p>
      </div>
    </footer>
  );
}
