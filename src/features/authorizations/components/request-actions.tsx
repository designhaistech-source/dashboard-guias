import { useEffect, useState, type ReactNode } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, CheckCircle2, ChevronDown, Sparkles, ClipboardCheck, FileText, Hourglass, XCircle, Receipt, Send, Wrench } from "lucide-react";
import { toast } from "sonner";
import { AppModal } from "@/components/app-modal";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Field } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatIsoToBr, todayLocalIsoDate } from "@/lib/date";
import { useCurrentProfile } from "@/lib/current-profile";
import { AUTHORIZATION_STATUS_LABEL, type AuthorizationStatus } from "../data/authorization-requests";
import {
  prepareBilling,
  sendBilling,
  registerExecution,
  registerOperatorResponse,
  requestAuthorization,
  resolveIssue,
  resendDenied,
  closeDenied,
  type Actor,
  type TrackedRequest,
} from "../data/requests-store";
import { formatDateTime, RequestTimeline } from "./request-timeline";
import { billingValidationOf } from "../data/billing-validation";
import { cn } from "@/lib/utils";

/** Ação executável por situação; `null` = somente consulta. */
export const ACTION_BY_STATUS: Partial<Record<AuthorizationStatus, { label: string; icon: typeof Send }>> = {
  pendente: { label: "Registrar solicitação de autorização", icon: Send },
  aguardando: { label: "Registrar retorno da operadora", icon: Hourglass },
  autorizada: { label: "Confirmar realização", icon: ClipboardCheck },
  pendencia: { label: "Resolver pendência", icon: Wrench },
  realizada: { label: "Preparar faturamento", icon: Receipt },
  faturar: { label: "Faturamento", icon: Receipt },
  negada: { label: "Resolver negativa", icon: XCircle },
};

/** Stages opened in the drawer for consultation only, with no action yet. */
export const VIEW_ONLY_STAGES: Partial<Record<AuthorizationStatus, { label: string; icon: typeof Send }>> = {};

/** Stages whose drawer also shows the request history. */
const WITH_HISTORY: AuthorizationStatus[] = ["realizada", "faturar", "negada"];

type Fact = [string, ReactNode];

export function FactList({ facts }: { facts: Fact[] }) {
  return (
    <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
      {facts.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-xs font-medium text-muted-foreground">{k}</dt>
          <dd className="mt-0.5 break-words text-foreground" suppressHydrationWarning>{v || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Dados de conferência exibidos em cada ação, conforme a etapa. */
export function requestFacts(r: TrackedRequest, status: AuthorizationStatus = r.status): Fact[] {
  const base: Fact[] = [
    ["Paciente", r.patient],
    ["Procedimento", `${r.procedureCode} · ${r.procedure}`],
    ["Profissional solicitante", r.doctor],
    ["Operadora", r.operadora],
  ];
  if (status === "pendente") return [...base, ["Data da solicitação", formatDateTime(r.receivedAt)]];
  if (status === "aguardando")
    return [
      ...base,
      ["Autorização solicitada em", formatIsoToBr(r.authorization?.requestedAt)],
      ["Protocolo", r.authorization?.protocol],
    ];
  if (status === "autorizada")
    return [
      ...base,
      ["Número da autorização", r.response?.number],
      ["Validade da autorização", formatIsoToBr(r.response?.validity) || "Não informada"],
    ];
  if (status === "faturar")
    return [
      ...base,
      ["Protocolo", r.authorization?.protocol],
      ["Número da autorização", r.response?.number],
      ["Validade da autorização", formatIsoToBr(r.response?.validity) || "Não informada"],
      ["Data da realização", formatIsoToBr(r.execution?.date)],
      ["Realização registrada por", r.execution?.registeredBy],
    ];
  if (status === "realizada")
    return [
      ...base,
      ["Número da autorização", r.response?.number],
      ["Data da realização", formatIsoToBr(r.execution?.date)],
    ];
  if (status === "negada") return [...base, ["Protocolo", r.authorization?.protocol || "Não informado"]];
  if (status === "pendencia")
    return [
      ...base,
      ["Protocolo", r.authorization?.protocol],
      ["Motivo da pendência", r.response?.reason],
      ["Observações", r.response?.notes],
    ];
  return base;
}

/** Protótipo: representação da solicitação enviada pelo profissional. */
export function OriginalDocumentButton({ request: r }: { request: TrackedRequest }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <FileText className="h-4 w-4" aria-hidden="true" />
        Ver solicitação original
      </Button>
      <AppModal
        open={open}
        onOpenChange={setOpen}
        title="Solicitação original"
        description={`Documento enviado por ${r.doctor} em ${formatDateTime(r.receivedAt)}.`}
        icon={<FileText className="h-5 w-5" aria-hidden="true" />}
        footer={<Button variant="outline" onClick={() => setOpen(false)}>Fechar</Button>}
      >
        <div className="space-y-4 rounded-xl border border-border bg-muted p-4">
          <p className="text-sm font-semibold text-foreground">Solicitação de exame · {r.id}</p>
          <FactList
            facts={[
              ["Paciente", r.patient],
              ["Operadora", r.operadora],
              ["Código TUSS", <span className="font-mono">{r.procedureCode}</span>],
              ["Procedimento", r.procedure],
              ["Profissional solicitante", r.doctor],
              ["Enviada em", formatDateTime(r.receivedAt)],
            ]}
          />
        </div>
      </AppModal>
    </>
  );
}

const optional = z.string().max(500, "Máximo de 500 caracteres.").optional();
const requiredDate = z.string().min(1, "Informe a data.");

const authSchema = z.object({ requestedAt: requiredDate, protocol: z.string().max(40).optional(), notes: optional });
const responseSchema = z
  .object({
    result: z.enum(["autorizada", "negada", "pendencia"], { required_error: "Selecione o resultado." }),
    number: z.string().max(40).optional(),
    date: z.string().optional(),
    validity: z.string().optional(),
    reason: optional,
    notes: optional,
  })
  .superRefine((v, ctx) => {
    if (v.result === "autorizada") {
      if (!v.number?.trim()) ctx.addIssue({ code: "custom", path: ["number"], message: "Informe o número da autorização." });
      if (!v.date) ctx.addIssue({ code: "custom", path: ["date"], message: "Informe a data da autorização." });
    }
    if (v.result === "pendencia" && !v.reason?.trim())
      ctx.addIssue({ code: "custom", path: ["reason"], message: "Descreva a pendência." });
  });
const executionSchema = z.object({ date: requiredDate, notes: optional });
const issueSchema = z.object({ notes: optional });

interface FormProps {
  request: TrackedRequest;
  actor: Actor;
  onDone: () => void;
  formId: string;
  /** Lets a form with several paths name the footer CTA; undefined disables it. */
  onSubmitLabel?: (label: string | undefined) => void;
}

function done(ok: boolean, title: string, description: string, onDone: () => void) {
  if (ok) toast.success(title, { description });
  else toast.error("Não foi possível registrar", { description: "A situação desta solicitação mudou. Atualize a tela." });
  onDone();
}

function AuthorizationForm({ request: r, actor, onDone, formId }: FormProps) {
  const { register, handleSubmit, formState } = useForm<z.infer<typeof authSchema>>({
    resolver: zodResolver(authSchema),
    defaultValues: { requestedAt: todayLocalIsoDate(), protocol: "", notes: "" },
  });
  return (
    <form
      id={formId}
      className="space-y-4"
      onSubmit={handleSubmit((v) =>
        done(requestAuthorization(r.id, v, actor), "Solicitação registrada", `${r.patient} agora está em Aguardando operadora.`, onDone),
      )}
    >
      <h3 className="text-sm font-semibold text-foreground">Dados da solicitação à operadora</h3>
      <Field id="auth-date" label="Data da solicitação" required error={formState.errors.requestedAt?.message}>
        <Input type="date" max={todayLocalIsoDate()} {...register("requestedAt")} />
      </Field>
      <Field id="auth-protocol" label="Protocolo" optional>
        <Input maxLength={40} placeholder="Ex.: PRT-123456" {...register("protocol")} />
      </Field>
      <Field id="auth-notes" label="Observações" optional error={formState.errors.notes?.message}>
        <Textarea maxLength={500} {...register("notes")} />
      </Field>
    </form>
  );
}

const RESULTS: { value: "autorizada" | "negada" | "pendencia"; label: string }[] = [
  { value: "autorizada", label: "Autorizada" },
  { value: "negada", label: "Não autorizada" },
  { value: "pendencia", label: "Com pendência" },
];

function ResponseForm({ request: r, actor, onDone, formId }: FormProps) {
  const { register, handleSubmit, control, watch, formState } = useForm<z.infer<typeof responseSchema>>({
    resolver: zodResolver(responseSchema),
    defaultValues: { number: "", date: todayLocalIsoDate(), validity: "", reason: "", notes: "" },
  });
  const result = watch("result");
  const e = formState.errors;
  return (
    <form
      id={formId}
      className="space-y-4"
      onSubmit={handleSubmit((v) => {
        const ok = registerOperatorResponse(r.id, { ...v, date: v.result === "autorizada" ? v.date : undefined }, actor);
        const desc =
          v.result === "autorizada"
            ? `${r.patient} autorizado. ${r.doctor} recebeu a confirmação.`
            : `${r.patient} agora está em ${AUTHORIZATION_STATUS_LABEL[v.result]}.`;
        done(ok, "Retorno registrado", desc, onDone);
      })}
    >
      <h3 className="text-sm font-semibold text-foreground">Retorno da operadora</h3>
      <fieldset className="space-y-2" aria-describedby={e.result ? "resp-result-msg" : undefined}>
        <legend className="text-xs font-medium text-muted-foreground">
          Resultado<span aria-hidden className="text-destructive"> *</span>
        </legend>
        <Controller
          control={control}
          name="result"
          render={({ field }) => (
            <RadioGroup value={field.value ?? ""} onValueChange={field.onChange} className="grid-cols-1 sm:grid-cols-3">
              {RESULTS.map((o) => (
                <label
                  key={o.value}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground has-[[data-state=checked]]:border-primary"
                >
                  <RadioGroupItem value={o.value} />
                  {o.label}
                </label>
              ))}
            </RadioGroup>
          )}
        />
        {e.result && <p id="resp-result-msg" role="alert" className="text-xs text-destructive">{e.result.message}</p>}
      </fieldset>

      {result === "autorizada" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="resp-number" label="Número da autorização" required error={e.number?.message} className="sm:col-span-2">
            <Input maxLength={40} {...register("number")} />
          </Field>
          <Field id="resp-date" label="Data da autorização" required error={e.date?.message}>
            <Input type="date" {...register("date")} />
          </Field>
          <Field id="resp-validity" label="Validade" optional>
            <Input type="date" {...register("validity")} />
          </Field>
        </div>
      )}
      {(result === "negada" || result === "pendencia") && (
        <Field
          id="resp-reason"
          label={result === "negada" ? "Motivo" : "Descrição da pendência"}
          required={result === "pendencia"}
          optional={result === "negada"}
          error={e.reason?.message}
        >
          <Textarea maxLength={500} {...register("reason")} />
        </Field>
      )}
      {result && (
        <Field id="resp-notes" label="Observações" optional error={e.notes?.message}>
          <Textarea maxLength={500} {...register("notes")} />
        </Field>
      )}
    </form>
  );
}

function ExecutionForm({ request: r, actor, onDone, formId }: FormProps) {
  const { register, handleSubmit, formState } = useForm<z.infer<typeof executionSchema>>({
    resolver: zodResolver(executionSchema),
    defaultValues: { date: todayLocalIsoDate(), notes: "" },
  });
  return (
    <form
      id={formId}
      className="space-y-4"
      onSubmit={handleSubmit((v) =>
        done(registerExecution(r.id, v, actor), "Realização registrada", `O exame de ${r.patient} foi marcado como realizado.`, onDone),
      )}
    >
      <h3 className="text-sm font-semibold text-foreground">Realização do exame</h3>
      <Field id="exec-date" label="Data da realização" required error={formState.errors.date?.message}>
        <Input type="date" max={todayLocalIsoDate()} {...register("date")} />
      </Field>
      <Field id="exec-notes" label="Observações" optional>
        <Textarea maxLength={500} {...register("notes")} />
      </Field>
    </form>
  );
}

function IssueForm({ request: r, actor, onDone, formId }: FormProps) {
  const { register, handleSubmit } = useForm<z.infer<typeof issueSchema>>({
    resolver: zodResolver(issueSchema),
    defaultValues: { notes: "" },
  });
  return (
    <form
      id={formId}
      className="space-y-4"
      onSubmit={handleSubmit((v) =>
        done(resolveIssue(r.id, v.notes ?? "", actor), "Pendência resolvida", `${r.patient} voltou para Aguardando operadora.`, onDone),
      )}
    >
      <h3 className="text-sm font-semibold text-foreground">Resolver pendência</h3>
      <p className="text-sm text-muted-foreground">
        Após resolver a pendência junto à operadora, reenvie a solicitação. Os tipos de pendência resolvidos pelo sistema serão definidos depois.
      </p>
      <Field id="issue-notes" label="O que foi feito" optional>
        <Textarea maxLength={500} {...register("notes")} />
      </Field>
    </form>
  );
}

function BillingForm({ request: r, actor, onDone, formId }: FormProps) {
  const { register, handleSubmit } = useForm<z.infer<typeof issueSchema>>({
    resolver: zodResolver(issueSchema),
    defaultValues: { notes: "" },
  });
  return (
    <form
      id={formId}
      className="space-y-4"
      onSubmit={handleSubmit((v) =>
        done(prepareBilling(r.id, v.notes, actor), "Faturamento preparado", `${r.patient} agora está em Para faturar.`, onDone),
      )}
    >
      <h3 className="text-sm font-semibold text-foreground">Preparar faturamento</h3>
      <p className="text-sm text-muted-foreground">
        A solicitação seguirá para Para faturar. A conferência e o envio da cobrança à operadora serão definidos depois.
      </p>
      <Field id="billing-notes" label="Observações" optional>
        <Textarea maxLength={500} {...register("notes")} />
      </Field>
    </form>
  );
}

/** Prototype: shows a sample AI result; real validation rules are not defined yet. */
function BillingValidationPanel({ request: r }: { request: TrackedRequest }) {
  const { hasIssues } = billingValidationOf(r);
  const Icon = hasIssues ? AlertTriangle : CheckCircle2;
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4",
        hasIssues ? "border-warning bg-warning-muted" : "border-border bg-card",
      )}
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", hasIssues ? "text-warning-strong" : "text-success-strong")} aria-hidden="true" />
      <div className="space-y-1 text-sm">
        <p className="font-semibold text-foreground">{hasIssues ? "Inconsistências identificadas" : "Validação concluída"}</p>
        <p className="text-foreground">
          {hasIssues
            ? "Foram identificadas inconsistências que precisam ser revisadas antes do envio."
            : "Nenhuma inconsistência identificada."}
        </p>
      </div>
    </div>
  );
}

function SendBillingForm({ request: r, actor, onDone, formId }: FormProps) {
  return (
    <form
      id={formId}
      onSubmit={(e) => {
        e.preventDefault();
        done(sendBilling(r.id, actor), "Cobrança enviada à operadora", `A cobrança de ${r.patient} foi enviada à ${r.operadora}.`, onDone);
      }}
    />
  );
}

const deniedSchema = z.object({
  path: z.enum(["reenviar", "encerrar"], { required_error: "Selecione como resolver." }),
  notes: optional,
});
const DENIED_PATHS = [
  { value: "reenviar", label: "Reenviar solicitação", hint: "Corrigida ou complementada, volta a aguardar a resposta da operadora." },
  { value: "encerrar", label: "Encerrar solicitação", hint: "Sem continuidade. Sai das raias e mantém o histórico." },
] as const;

function DeniedForm({ request: r, actor, onDone, formId, onSubmitLabel }: FormProps) {
  const { register, handleSubmit, control, watch, formState } = useForm<z.infer<typeof deniedSchema>>({
    resolver: zodResolver(deniedSchema),
    defaultValues: { notes: "" },
  });
  const [confirming, setConfirming] = useState(false);
  const path = watch("path");
  useEffect(() => setConfirming(false), [path]);
  useEffect(() => {
    onSubmitLabel?.(
      path === "reenviar" ? "Reenviar solicitação" : path === "encerrar" ? (confirming ? "Confirmar encerramento" : "Encerrar solicitação") : undefined,
    );
  }, [path, confirming, onSubmitLabel]);
  return (
    <form
      id={formId}
      className="space-y-4"
      onSubmit={handleSubmit((v) => {
        if (v.path === "reenviar")
          return done(resendDenied(r.id, v.notes, actor), "Solicitação reenviada", `${r.patient} aguarda nova resposta da operadora.`, onDone);
        // Closing is irreversible in the prototype, so it takes a second, explicit confirmation.
        if (!confirming) return setConfirming(true);
        done(closeDenied(r.id, v.notes, actor), "Solicitação encerrada", `${r.patient} saiu das raias. O histórico foi mantido.`, onDone);
      })}
    >
      <h3 className="text-sm font-semibold text-foreground">Resolver negativa</h3>
      <fieldset className="space-y-2" aria-describedby={formState.errors.path ? "denied-path-msg" : undefined}>
        <legend className="text-xs font-medium text-muted-foreground">
          Como resolver<span aria-hidden className="text-destructive"> *</span>
        </legend>
        <Controller
          control={control}
          name="path"
          render={({ field }) => (
            <RadioGroup value={field.value ?? ""} onValueChange={field.onChange} className="grid-cols-1">
              {DENIED_PATHS.map((o) => (
                <label
                  key={o.value}
                  className="flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground has-[[data-state=checked]]:border-primary"
                >
                  <RadioGroupItem value={o.value} className="mt-0.5" />
                  <span>
                    <span className="block font-medium">{o.label}</span>
                    <span className="block text-xs text-muted-foreground">{o.hint}</span>
                  </span>
                </label>
              ))}
            </RadioGroup>
          )}
        />
        {formState.errors.path && (
          <p id="denied-path-msg" role="alert" className="text-xs text-destructive">{formState.errors.path.message}</p>
        )}
      </fieldset>
      <Field id="denied-notes" label={path === "encerrar" ? "Motivo do encerramento" : "O que foi feito"} optional error={formState.errors.notes?.message}>
        <Textarea maxLength={500} {...register("notes")} />
      </Field>
      {confirming && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-destructive bg-destructive/10 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive-strong" aria-hidden="true" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-foreground">Encerrar esta solicitação?</p>
            <p className="text-muted-foreground">
              {r.patient} sairá das raias ativas e não terá mais ações. O histórico será mantido. Clique em "Confirmar encerramento" para concluir.
            </p>
          </div>
        </div>
      )}
    </form>
  );
}

/** Operator denial summary shown before resolving it. */
function DeniedResponse({ request: r }: { request: TrackedRequest }) {
  return (
    <FactList
      facts={[
        ["Situação", <span className="inline-flex items-center gap-1 font-semibold text-destructive-strong"><XCircle className="h-3.5 w-3.5" aria-hidden="true" />Não autorizada</span>],
        ["Data e horário do retorno", r.response ? formatDateTime(r.response.registeredAt) : undefined],
        ["Motivo da negativa", r.response?.reason || "Não informado"],
        ["Registrado por", r.response?.registeredBy],
      ]}
    />
  );
}

const FORMS: Partial<Record<AuthorizationStatus, { Form: (p: FormProps) => ReactNode; submit: string }>> = {
  pendente: { Form: AuthorizationForm, submit: "Registrar solicitação" },
  aguardando: { Form: ResponseForm, submit: "Registrar retorno" },
  autorizada: { Form: ExecutionForm, submit: "Confirmar realização" },
  pendencia: { Form: IssueForm, submit: "Reenviar à operadora" },
  realizada: { Form: BillingForm, submit: "Preparar faturamento" },
  faturar: { Form: SendBillingForm, submit: "Enviar cobrança à operadora" },
  negada: { Form: DeniedForm, submit: "Escolha como resolver" },
};

/** Inline original-document summary; avoids opening a modal over the drawer. */
function OriginalDocumentInline({ request: r }: { request: TrackedRequest }) {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="group">
          <FileText className="h-4 w-4" aria-hidden="true" />
          Ver solicitação original
          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 space-y-3 rounded-xl border border-border bg-muted p-4">
        <p className="text-sm font-semibold text-foreground">Solicitação de exame · {r.id}</p>
        <FactList
          facts={[
            ["Código TUSS", <span className="font-mono">{r.procedureCode}</span>],
            ["Enviada em", formatDateTime(r.receivedAt)],
          ]}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Centered modal that runs the request's next action. */
export function RequestActionDialog({
  request: r,
  open,
  onOpenChange,
}: {
  request: TrackedRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const profile = useCurrentProfile();
  // Freezes the status the drawer opened with so the form does not swap after submit.
  const [status, setStatus] = useState<AuthorizationStatus | null>(null);
  useEffect(() => {
    if (open && r) setStatus(r.status);
  }, [open, r?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const entry = status ? FORMS[status] : undefined;
  const action = status ? (ACTION_BY_STATUS[status] ?? VIEW_ONLY_STAGES[status]) : undefined;
  const ready = Boolean(r && action);
  const formId = r ? `action-${r.id}` : "action";
  const Icon = action?.icon;
  const [dynamicLabel, setDynamicLabel] = useState<string | undefined>();
  useEffect(() => setDynamicLabel(undefined), [r?.id, status]);
  if (!r || !action || !Icon) return null;
  const multiPath = status === "negada";
  const submitLabel = multiPath ? (dynamicLabel ?? entry?.submit) : entry?.submit;
  const hasIssues = status === "faturar" && billingValidationOf(r).hasIssues;
  // Centered modal is the standard for every lane action.
  return (
    <AppModal
      open={open && ready}
      onOpenChange={onOpenChange}
      size="lg"
      title={action.label}
      description={`${r.id} · ${AUTHORIZATION_STATUS_LABEL[status as AuthorizationStatus]}`}
      icon={<Icon className="h-5 w-5" aria-hidden="true" />}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{entry ? "Cancelar" : "Fechar"}</Button>
          {hasIssues ? (
            <Button
              type="button"
              onClick={() =>
                toast.info("Revisão de inconsistências", {
                  description: "Os tipos de inconsistência e as correções ainda serão definidos.",
                })
              }
            >
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              Revisar inconsistências
            </Button>
          ) : entry && (
            <Button type="submit" form={formId} disabled={multiPath && !dynamicLabel}>
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {submitLabel}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        <section className="space-y-3" aria-labelledby={`${formId}-facts`}>
          <h3 id={`${formId}-facts`} className="text-sm font-semibold text-foreground">
            {status === "faturar" ? "Dados do atendimento" : "Dados da solicitação"}
          </h3>
          <FactList facts={requestFacts(r, status as AuthorizationStatus)} />
          <OriginalDocumentInline request={r} />
        </section>
        {status === "faturar" && (
          <section className="space-y-3" aria-labelledby={`${formId}-ai`}>
            <h3 id={`${formId}-ai`} className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              Validação da IA
            </h3>
            <BillingValidationPanel request={r} />
          </section>
        )}
        {status === "negada" && (
          <section className="space-y-3" aria-labelledby={`${formId}-response`}>
            <h3 id={`${formId}-response`} className="text-sm font-semibold text-foreground">Retorno da operadora</h3>
            <DeniedResponse request={r} />
          </section>
        )}
        {status && WITH_HISTORY.includes(status) && (
          <section className="space-y-3" aria-labelledby={`${formId}-history`}>
            <h3 id={`${formId}-history`} className="text-sm font-semibold text-foreground">
              {status === "negada" ? "Histórico da solicitação" : "Histórico do andamento"}
            </h3>
            <RequestTimeline history={r.history} />
          </section>
        )}
        {entry && (
          <>
            <entry.Form request={r} actor={{ name: profile.name, roleLabel: profile.roleLabel }} onDone={() => onOpenChange(false)} formId={formId} onSubmitLabel={setDynamicLabel} />
            <p className="text-xs text-muted-foreground">
              Será registrado automaticamente com data, hora e {profile.name} — {profile.roleLabel}.
            </p>
          </>
        )}
      </div>
    </AppModal>
  );
}
