import { useState } from "react";
import { Search, ScanSearch, Lightbulb } from "lucide-react";

import { SearchPageLayout } from "@/components/search-page-layout";
import { SearchInput, SelectField } from "@/components/form-field";
import { Button } from "@/components/ui/button";

import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
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

/**
 * Consulta assíncrona simulada (dados sintéticos). O termo "erro" força a
 * falha para permitir validar o estado de erro do protótipo.
 */
function fetchProcedures(
  term: string,
  referencia: string,
): Promise<ProcedureMatch[]> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (term.trim().toLowerCase().includes("erro")) {
        reject(new Error("Falha simulada na consulta de procedimentos"));
        return;
      }
      resolve(searchProcedures(term, referencia));
    }, 500);
  });
}

export function ProcedureSearchPage() {
  const [term, setTerm] = useState("");
  const [referencia, setReferencia] = useState("todas");
  const [results, setResults] = useState<ProcedureMatch[] | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">(
    "idle",
  );
  const [lastQuery, setLastQuery] = useState("");

  async function runSearch(nextTerm: string, nextReferencia: string) {
    setTerm(nextTerm);
    setReferencia(nextReferencia);
    setLastQuery(nextTerm.trim());
    setStatus("loading");
    try {
      setResults(await fetchProcedures(nextTerm, nextReferencia));
      setStatus("done");
    } catch {
      setResults(null);
      setStatus("error");
    }
  }

  function handleSearch(event?: React.FormEvent) {
    event?.preventDefault();
    void runSearch(term, referencia);
  }


  return (
    <SearchPageLayout
      activeKey="procedimento"
      title="Buscar procedimento"
      description="Consulte códigos e descrições de procedimentos por referência (Tuss e Sigtap) para usar em guias e solicitações."
      onSubmit={handleSearch}
      submitting={status === "loading"}

      searchFields={
        <>
          <div className="min-w-0 flex-1">
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
            className="lg:w-44 space-y-0 sm:space-y-0"
            triggerClassName="w-full"
          />
        </>
      }
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
                <div className="flex items-center justify-between px-4 py-3 border-b border-border sm:px-6">
                  <p className="text-sm text-muted-foreground">
                    {results.length}{" "}
                    {results.length === 1
                      ? "procedimento encontrado"
                      : "procedimentos encontrados"}
                  </p>
                </div>

                {/* Mobile: cartões empilhados evitam rolagem horizontal */}
                <ul className="max-h-[32rem] divide-y divide-border overflow-y-auto lg:hidden">
                  {results.map((p) => (
                    <li
                      key={`${p.referencia}-${p.codigo}`}
                      className="space-y-2 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-mono text-xs tabular-nums">
                          {p.codigo}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {REFERENCE_LABELS[p.referencia]}
                        </span>
                      </div>
                      <p className="text-sm lowercase break-words">
                        {p.descricao}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Similaridade:{" "}
                        <span className="font-mono tabular-nums">
                          {p.similaridade}%
                        </span>
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="hidden max-h-[32rem] overflow-y-auto lg:block">
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
    </SearchPageLayout>
  );
}

