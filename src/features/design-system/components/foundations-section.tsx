import { typeScale, radiusScale, spacingScale, elevationScale } from "../data/tokens";
import { DsSubhead } from "./ds-section";

export function TypographySection() {
  return (
    <div className="space-y-3">
      <DsSubhead
        title="Escala tipográfica"
        hint="Plus Jakarta Sans para títulos, Vazirmatn para corpo, JetBrains Mono para códigos."
      />
      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        {typeScale.map((item) => (
          <div
            key={item.label}
            className="grid gap-2 p-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center"
          >
            <p className={`min-w-0 truncate ${item.className}`}>{item.sample}</p>
            <div className="min-w-0 lg:text-right">
              <p className="truncate text-xs font-medium text-foreground">{item.label}</p>
              <p className="truncate font-mono text-[11px] text-muted-foreground">{item.spec}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FoundationsSection() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <DsSubhead title="Raio de borda" hint="Quanto maior o bloco, maior o raio." />
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {radiusScale.map((item) => (
            <div key={item.name} className="min-w-0 rounded-xl border border-border bg-card p-3">
              <div
                className={`h-12 border border-border-strong bg-surface-subtle ${item.className}`}
                aria-hidden
              />
              <p className="mt-2 truncate font-mono text-[11px] text-foreground">{item.name}</p>
              <p className="truncate text-xs text-muted-foreground">{item.usage}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <DsSubhead title="Elevação" hint="Sombra indica camada, nunca hierarquia de conteúdo." />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {elevationScale.map((item) => (
            <div
              key={item.name}
              className={`min-w-0 rounded-xl border border-border bg-card p-4 ${item.className}`}
            >
              <p className="truncate font-mono text-[11px] text-foreground">{item.name}</p>
              <p className="truncate text-xs text-muted-foreground">{item.usage}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <DsSubhead title="Espaçamento" hint="Múltiplos de 4px. Seções sempre com 24px entre si." />
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {spacingScale.map((item) => (
            <div
              key={item.name}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-mono text-xs text-foreground">{item.name}</p>
                <p className="truncate text-xs text-muted-foreground">{item.usage}</p>
              </div>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">{item.size}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
