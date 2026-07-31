import { useState } from "react";
import { Search, ScanSearch, Lightbulb } from "lucide-react";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { SearchInput, SelectField } from "@/components/form-field";
import { Button } from "@/components/ui/button";

import { EmptyState } from "@/components/data-state";
import {
  DataTable,
  DataTableRoot,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
} from "@/components/data-table";
import {
  REFERENCE_OPTIONS,
  searchProcedures,
  REFERENCE_LABELS,
  type ProcedureMatch,
} from "../data/procedures";

/** Termos sugeridos quando a busca não retorna resultados. */
const SUGGESTED_TERMS = [
  "consulta",
  "hemograma",
  "ressonância",
  "ultrassonografia",
  "biópsia",
];

export function ProcedureSearchPage() {
  const [term, setTerm] = useState("");
  const [referencia, setReferencia] = useState("todas");
  const [results, setResults] = useState<ProcedureMatch[] | null>(null);
  const [lastQuery, setLastQuery] = useState("");

  function runSearch(nextTerm: string, nextReferencia: string) {
    setTerm(nextTerm);
    setReferencia(nextReferencia);
    setLastQuery(nextTerm.trim());
    setResults(searchProcedures(nextTerm, nextReferencia));
  }

  function handleSearch(event?: React.FormEvent) {
    event?.preventDefault();
    runSearch(term, referencia);
  }



  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <AppSidebar activeKey="procedimento" />

      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <div className="w-full flex-1 space-y-6 px-6 py-8 pb-16 lg:px-10">
          <AppBreadcrumb />
          <PageHeader
            title="Busca de procedimentos"
            description="Consulte códigos e descrições de procedimentos por referência (Tuss e Sigtap) para usar em guias e solicitações."
          />

          <form
            onSubmit={handleSearch}
            className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <div className="flex-1 min-w-0">
              <SearchInput
                id="busca-procedimento"
                aria-label="Buscar por procedimento"
                placeholder="Buscar por procedimento ou código"
                value={term}
                clearable
                onChange={(e) => setTerm(e.target.value)}
              />
            </div>
            <SelectField
              id="referencia"
              value={referencia}
              onValueChange={setReferencia}
              options={REFERENCE_OPTIONS}
              className="sm:w-44 space-y-0"
              triggerClassName="w-full"
            />
            <Button type="submit" className="sm:w-32">
              Buscar
            </Button>
          </form>


          <section
            aria-label="Resultados da busca"
            className="rounded-xl border border-border bg-card"
          >
            {results === null ? (
              <EmptyState
                size="lg"
                icon={<Search className="h-12 w-12" />}
                title="Faça uma busca"
                description="Digite o procedimento e selecione a referência para visualizar os resultados."
              />
            ) : results.length === 0 ? (
              <EmptyState
                size="lg"
                icon={<ScanSearch className="h-12 w-12" />}
                title="Nenhum procedimento encontrado"
                description={
                  lastQuery
                    ? `Não encontramos resultados para “${lastQuery}”${
                        referencia !== "todas"
                          ? ` na referência ${REFERENCE_OPTIONS.find((o) => o.value === referencia)?.label}`
                          : ""
                      }. Verifique a grafia, use termos mais curtos ou tente uma das sugestões abaixo.`
                    : "Verifique a grafia, use termos mais curtos ou tente uma das sugestões abaixo."
                }
                action={
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Sugestões:
                      </span>
                      {SUGGESTED_TERMS.map((sugestao) => (
                        <Button
                          key={sugestao}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => runSearch(sugestao, "todas")}
                        >
                          <Lightbulb />
                          {sugestao}
                        </Button>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {referencia !== "todas" && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => runSearch(term, "todas")}
                        >
                          Buscar em todas as referências
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTerm("");
                          setReferencia("todas");
                          setLastQuery("");
                          setResults(null);
                        }}
                      >
                        Limpar busca
                      </Button>
                    </div>
                  </div>
                }
              />

            ) : (
              <>
                <div className="flex items-center justify-between px-6 py-3 border-b border-border">
                  <p className="text-sm text-muted-foreground">
                    {results.length}{" "}
                    {results.length === 1
                      ? "procedimento encontrado"
                      : "procedimentos encontrados"}
                  </p>
                </div>
                <div className="max-h-[32rem] overflow-y-auto">
                  <DataTable className="rounded-none border-0">
                    <DataTableRoot className="table-fixed">
                      <DataTableHeader className="sticky top-0 z-10 bg-card">
                        <tr>
                          <DataTableHead className="w-[16%] whitespace-nowrap">
                            Código
                          </DataTableHead>
                          <DataTableHead className="w-[52%]">
                            Procedimento
                          </DataTableHead>
                          <DataTableHead className="w-[16%] whitespace-nowrap text-right">
                            Similaridade
                          </DataTableHead>
                          <DataTableHead className="w-[16%] whitespace-nowrap text-right">
                            Referência
                          </DataTableHead>
                        </tr>
                      </DataTableHeader>
                      <DataTableBody>
                        {results.map((p) => (
                          <DataTableRow key={`${p.referencia}-${p.codigo}`}>
                            <DataTableCell className="whitespace-nowrap font-mono text-xs tabular-nums">
                              {p.codigo}
                            </DataTableCell>
                            <DataTableCell className="truncate lowercase">
                              {p.descricao}
                            </DataTableCell>
                            <DataTableCell className="whitespace-nowrap text-right font-mono text-xs tabular-nums">
                              {p.similaridade}%
                            </DataTableCell>
                            <DataTableCell className="whitespace-nowrap text-right text-muted-foreground">
                              {REFERENCE_LABELS[p.referencia]}
                            </DataTableCell>
                          </DataTableRow>
                        ))}
                      </DataTableBody>
                    </DataTableRoot>
                  </DataTable>
                </div>
              </>
            )}

          </section>
        </div>

        <SiteFooter />
      </main>
    </div>
  );
}
