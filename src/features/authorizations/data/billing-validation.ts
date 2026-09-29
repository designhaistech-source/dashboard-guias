import type { AuthorizationRequest } from "./authorization-requests";

export interface BillingValidation {
  hasIssues: boolean;
}

/**
 * Prototype-only sample result: no real AI rule runs. Alternates by request number
 * so both scenarios appear in the demo data.
 */
export function billingValidationOf(r: Pick<AuthorizationRequest, "id">): BillingValidation {
  const n = Number(r.id.replace(/\D/g, "")) || 0;
  return { hasIssues: n % 2 === 1 };
}
