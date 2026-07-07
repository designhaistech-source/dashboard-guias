import caurnLogo from "@/assets/convenio-caurn-real.png.asset.json";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
        <p className="text-sm text-muted-foreground">
          © 2026 HaisGuias | Todos os direitos reservados
        </p>
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-muted-foreground tracking-wide">
            UMA INICIATIVA DE
          </span>
          <span className="text-sm font-semibold text-foreground">HaisTech</span>
          <img src={caurnLogo.url} alt="CAURN" className="h-6 w-auto" />
        </div>
      </div>
    </footer>
  );
}
