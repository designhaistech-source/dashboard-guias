import { DsSubhead } from "./ds-section";

const NEUTRALS: { step: string; className: string }[] = [
  { step: "50", className: "bg-neutral-50" },
  { step: "100", className: "bg-neutral-100" },
  { step: "200", className: "bg-neutral-200" },
  { step: "300", className: "bg-neutral-300" },
  { step: "400", className: "bg-neutral-400" },
  { step: "500", className: "bg-neutral-500" },
  { step: "600", className: "bg-neutral-600" },
  { step: "700", className: "bg-neutral-700" },
  { step: "800", className: "bg-neutral-800" },
  { step: "900", className: "bg-neutral-900" },
];

import { colorGroups } from "../data/tokens";

export function ColorsSection() {
  return (
    <div className="space-y-6">
      {colorGroups.map((group) => (
        <div key={group.title} className="space-y-3">
          <DsSubhead title={group.title} hint={group.description} />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {group.tokens.map((token) => (
              <div
                key={token.name}
                className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <span
                  className={`h-10 w-10 shrink-0 rounded-lg border border-border ${token.swatch}`}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-foreground">--{token.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{token.usage}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="space-y-3">
        <DsSubhead
          title="Escala neutra"
          hint="Base para superfícies, bordas e texto. Não use cinzas fora desta escala."
        />
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
          {NEUTRALS.map((tone) => (
            <div key={tone.step} className="min-w-0">
              <div
                className={`h-12 rounded-lg border border-border ${tone.className}`}
                aria-hidden
              />
              <p className="mt-1 text-center font-mono text-[11px] text-muted-foreground">
                {tone.step}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
