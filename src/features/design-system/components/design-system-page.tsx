import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { DsSection } from "./ds-section";
import { ColorsSection } from "./colors-section";
import { TypographySection, FoundationsSection } from "./foundations-section";
import { ComponentsSection } from "./components-section";
import { PatternsSection } from "./patterns-section";

/** Guia vivo do design system HaisGuias. */
export function DesignSystemPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar activeKey="ajuda" />
      <div className="flex min-h-screen flex-1 flex-col">
        <main className="flex-1 space-y-6 p-6 pb-16">
          <PageHeader
            title="Design system"
            description="Fundamentos visuais, componentes e padrões de interface usados em todas as telas do HaisGuias. Use esta referência antes de criar qualquer tela nova."
          />

          <DsSection
            id="cores"
            title="1. Cores"
            description="Todos os valores vêm de tokens semânticos definidos em styles.css. Nunca use cores fixas em componentes."
          >
            <ColorsSection />
          </DsSection>

          <DsSection
            id="tipografia"
            title="2. Tipografia"
            description="Duas famílias: Plus Jakarta Sans nos títulos e Vazirmatn no corpo. Tamanhos limitados à escala abaixo."
          >
            <TypographySection />
          </DsSection>

          <DsSection
            id="fundamentos"
            title="3. Raio, elevação e espaçamento"
            description="Geometria consistente entre cards, campos e sobreposições."
          >
            <FoundationsSection />
          </DsSection>

          <DsSection
            id="componentes"
            title="4. Componentes"
            description="Blocos reutilizáveis com suas variantes oficiais. Qualquer nova variante deve ser adicionada aqui."
          >
            <ComponentsSection />
          </DsSection>

          <DsSection
            id="padroes"
            title="5. Padrões de página"
            description="Composições recorrentes: cabeçalho, cards de seção, barra de ação, tabelas e estados de dados."
          >
            <PatternsSection />
          </DsSection>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
