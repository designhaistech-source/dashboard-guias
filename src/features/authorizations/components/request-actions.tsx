import { useEffect, useState, type ReactNode } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, ClipboardCheck, FileText, Hourglass, Send, Wrench } from "lucide-react";
import { toast } from "sonner";
import { AppModal } from "@/components/app-modal";
import { Field } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatIsoToBr, todayLocalIsoDate } from "@/lib/date";
import { useCurrentProfile } from "@/lib/current-profile";
import { AUTHORIZATION_STATUS_LABEL, type AuthorizationStatus } from "../data/authorization-requests";
import {
  registerExecution,
  registerOperatorResponse,
  requestAuthorization,
  resolveIssue,
  type Actor,
  type TrackedRequest,
} from "../data/requests-store";
import { formatDateTime } from "./request-timeline";

/** Ação executável por situação; `null` = somente consulta. */
export const ACTION_BY_STATUS: Partial<Record<AuthorizationStatus, { label: string; icon: typeof Send }>> = {
  pendente: { label: "Solicitar autorização", icon: Send },
  aguardando: { label: "Confirmar autorização", icon: Hourglass },
  autorizada: { label: "Confirmar realização", icon: ClipboardCheck },
  pendencia: { label: "Resolver pendência", icon: Wrench },
};

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
        done(requestAuthorization(r.id, v, actor), "Autorização solicitada", `${r.patient} agora está em Aguardando operadora.`, onDone),
      )}
    >
      <h3 className="text-sm font-semibold text-foreground">Dados da autorização</h3>
      <Field id="auth-date" label="Data da solicitação à operadora" required error={formState.errors.requestedAt?.message}>
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

const FORMS: Partial<Record<AuthorizationStatus, { Form: (p: FormProps) => ReactNode; submit: string }>> = {
  pendente: { Form: AuthorizationForm, submit: "Confirmar solicitação" },
  aguardando: { Form: ResponseForm, submit: "Registrar retorno" },
  autorizada: { Form: ExecutionForm, submit: "Confirmar realização" },
  pendencia: { Form: IssueForm, submit: "Reenviar à operadora" },
};

/** Modal que executa a próxima ação da solicitação conforme a situação atual. */
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
  // Freezes the status the dialog opened with so the form doesn't swap after submit.
  const [status, setStatus] = useState<AuthorizationStatus | null>(null);
  useEffect(() => {
    if (open && r) setStatus(r.status);
  }, [open, r?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const entry = status ? FORMS[status] : undefined;
  const action = status ? ACTION_BY_STATUS[status] : undefined;
  if (!r || !entry || !action) return null;
  const formId = `action-${r.id}`;
  const Icon = action.icon;
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={action.label}
      description={`${r.id} · ${AUTHORIZATION_STATUS_LABEL[status as AuthorizationStatus]}`}
      icon={<Icon className="h-5 w-5" aria-hidden="true" />}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" form={formId}>
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {entry.submit}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <section className="space-y-3" aria-label="Dados para conferência">
          <FactList facts={requestFacts(r, status as AuthorizationStatus)} />
          <OriginalDocumentButton request={r} />
        </section>
        <p className="text-xs text-muted-foreground">
          Será registrado automaticamente com data, hora e {profile.name} — {profile.roleLabel}.
        </p>
        <entry.Form request={r} actor={{ name: profile.name, roleLabel: profile.roleLabel }} onDone={() => onOpenChange(false)} formId={formId} />
      </div>
    </AppModal>
  );
}
