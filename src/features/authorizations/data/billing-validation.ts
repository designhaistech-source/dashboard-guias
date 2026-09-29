import type { AuthorizationRequest } from "./authorization-requests";

export interface BillingValidation {
  hasIssues: boolean;
}

/**
 * Prototype-only sample result: no real AI rule runs. Alternates by the request number's digit sum
 * so both scenarios appear in the demo data.
 */
export function billingValidationOf(r: Pick<AuthorizationRequest, "id">): BillingValidation {
  const digitSum = [...r.id.replace(/\D/g, "")].reduce((sum, d) => sum + Number(d), 0);
  return { hasIssues: digitSum % 2 === 1 };
}
