# Handoff: portando este protótipo para React 18 + Tailwind 3 + React Router DOM

Este projeto roda na stack fixa do Lovable (React 19, Tailwind CSS v4, TanStack Start/Router).
Este documento mapeia cada padrão usado aqui para o equivalente na stack do time,
para que o port seja mecânico e sem adivinhação.

## 1. Roteamento: TanStack Router -> React Router DOM

Aqui as rotas são baseadas em arquivos: cada `src/routes/<nome>.tsx` exporta
`Route = createFileRoute("/<nome>")({ head, component })`. O layout global fica em
`src/routes/__root.tsx` e `src/routeTree.gen.ts` é gerado — ignore no port.

O conteúdo real de cada página está nos módulos de feature (`src/features/*`) ou no
componente exportado pela rota. **Só o invólucro precisa mudar.**

```tsx
// React Router DOM (v6) — src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProfilePage } from "@/features/profile";

<BrowserRouter>
  <AppLayout>
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/perfil" element={<ProfilePage />} />
      {/* ...uma linha por arquivo em src/routes/ */}
    </Routes>
  </AppLayout>
</BrowserRouter>
```

### Equivalências de API

| Aqui (`@tanstack/react-router`) | React Router DOM v6 |
| --- | --- |
| `<Link to="/perfil">` | `<Link to="/perfil">` (igual) |
| `useNavigate()({ to: "/x" })` | `useNavigate()("/x")` |
| `useRouterState({ select: s => s.location.pathname })` | `useLocation().pathname` |
| `useParams({ from: "/x/$id" })` | `useParams()` |
| `useSearch({ from })` / `validateSearch` | `useSearchParams()` |
| `head: () => ({ meta: [...] })` na rota | `react-helmet-async` ou `document.title` em `useEffect` |
| `loader` + `ensureQueryData` | `useQuery` no componente (TanStack Query v5 funciona igual) |
| `notFoundComponent` | `<Route path="*" element={<NotFound />} />` |
| `errorComponent` | `errorElement` ou um error boundary próprio |

Rotas de API (`src/routes/api/cid.ts`) e `createServerFn` não existem em SPA:
virarão endpoints do backend do time (o cliente só faz `fetch`).

## 2. Tailwind v4 -> v3

Aqui não existe `tailwind.config.ts`: todo o tema está em `src/styles.css` via
`@theme` / `@theme inline`. Para v3, crie o config e mova os tokens:

```js
// tailwind.config.ts (v3)
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["class"],
  theme: { extend: { colors: { /* copiar de @theme inline em src/styles.css */ } } },
  plugins: [require("tailwindcss-animate")],
};
```

| v4 (aqui) | v3 (destino) |
| --- | --- |
| `@import "tailwindcss";` | `@tailwind base; @tailwind components; @tailwind utilities;` |
| `@theme { --color-x: ... }` | `theme.extend.colors.x` no config |
| `@utility nome { ... }` | `@layer utilities { .nome { ... } }` |
| `@custom-variant dark (...)` | `darkMode: ["class"]` |
| `bg-(--token)` / `bg-[var(--token)]` | `bg-[var(--token)]` |
| `shadow-xs` / `shadow-sm` | `shadow-sm` / `shadow` |
| `rounded-xs` / `outline-hidden` | `rounded-sm` / `outline-none` |
| `ring-3` | `ring` |
| plugin Vite `@tailwindcss/vite` | `postcss.config.js` com `tailwindcss` + `autoprefixer` |

As variáveis CSS de `:root` (tokens semânticos do design system) continuam válidas —
mantenha-as e apenas registre-as no config.

## 3. React 19 -> React 18

O código de UI aqui é compatível com 18 na maior parte. Pontos a checar:

- `ref` como prop em componentes de função (React 19) -> voltar a `forwardRef`.
- `use()` / Server Components: **não usados** neste projeto.
- `useActionState` / `useFormStatus`: **não usados**.
- `<Context>` como provider direto -> usar `<Context.Provider>`.
- Tipos: `@types/react@18` + `@types/react-dom@18`; `ReactNode` já é importado como tipo.
- shadcn/ui, lucide-react, TanStack Query v5, React Hook Form + Zod funcionam em 18 sem mudança.

## 4. O que é 100% portável sem alteração

- `src/components/**` e `src/components/ui/**` (shadcn) — só ajuste de classes v3.
- `src/features/**` (regras de tela, schemas Zod, formulários).
- `src/hooks/**`, `src/lib/**` (utilitários puros).
- Tokens semânticos e tipografia (Plus Jakarta Sans / Vazirmatn / JetBrains Mono).

## 5. Ordem sugerida de port

1. Scaffold Vite + React 18 + Tailwind 3 + React Router DOM.
2. Copiar `src/styles.css` (convertendo v4 -> v3) e o `tailwind.config`.
3. Copiar `src/components`, `src/hooks`, `src/lib`, `src/features`.
4. Recriar o layout do `__root.tsx` como `AppLayout` e declarar as rotas em `App.tsx`.
5. Substituir `createFileRoute` pelos componentes de página nas `<Route>`.
6. Trocar `head()` por Helmet e as rotas de API por chamadas ao backend real.
