import { useState } from "react";
import { Search, ClipboardCopy, Filter, ScanSearch } from "lucide-react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { SearchInput, SelectField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  type Procedure,
} from "../data/procedures";

export function ProcedureSearchPage() {
  const [term, setTerm] = useState("");
  const [referencia, setReferencia] = useState("todas");
  const [results, setResults] = useState<Procedure[] | null>(null);

  function handleSearch(event?: React.FormEvent) {
    event?.preventDefault();
    setResults(searchProcedures(term, referencia));
  }

  async function copiar(codigo: string) {
    try {
      await navigator.clipboard.writeText(codigo);
      toast.success(`Código ${codigo} copiado`);
    } catch {
      toast.error("Não foi possível copiar o código");
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <AppSidebar activeKey="procedimento" />

      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <div className="w-full px-6 lg:px-10 py-8 space-y-6 flex-1 pb-24">
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
              <Filter />
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
                description="Revise o termo buscado ou selecione outra referência."
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setTerm("");
                      setReferencia("todas");
                      setResults(null);
                    }}
                  >
                    Limpar busca
                  </Button>
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
                <DataTable className="rounded-none border-0">
                  <DataTableRoot>
                    <DataTableHeader>
                      <tr>
                        <DataTableHead className="w-36">Código</DataTableHead>
                        <DataTableHead>Descrição</DataTableHead>
                        <DataTableHead className="w-28">Referência</DataTableHead>
                        <DataTableHead className="w-20">Porte</DataTableHead>
                        <DataTableHead className="w-16 text-right">Ações</DataTableHead>
                      </tr>
                    </DataTableHeader>
                    <DataTableBody>
                      {results.map((p) => (
                        <DataTableRow key={`${p.referencia}-${p.codigo}`}>
                          <DataTableCell className="font-mono text-xs">
                            {p.codigo}
                          </DataTableCell>
                          <DataTableCell>
                            <span className="font-medium">{p.descricao}</span>
                            <span className="block text-xs text-muted-foreground">
                              {p.grupo}
                            </span>
                          </DataTableCell>
                          <DataTableCell>
                            <Badge variant="secondary">{p.referencia}</Badge>
                          </DataTableCell>
                          <DataTableCell className="font-mono text-xs">
                            {p.porte}
                          </DataTableCell>
                          <DataTableCell className="text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Copiar código ${p.codigo}`}
                              onClick={() => copiar(p.codigo)}
                            >
                              <ClipboardCopy />
                            </Button>
                          </DataTableCell>
                        </DataTableRow>
                      ))}
                    </DataTableBody>
                  </DataTableRoot>
                </DataTable>
              </>
            )}
          </section>
        </div>

        <SiteFooter />
      </main>
    </div>
  );
}
