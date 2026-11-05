import { z } from 'zod';
import type { GoogleLoginMethod } from '@/core/admin/LoginMethod';

export function normalizeDomain(text: string): string {
  return text.trim().toLowerCase();
}

const emailSchema = z.email();

/** v1 accepted a domain when `test@<domain>` is a valid email; it ignored duplicates, v2 says so. */
export function domainError(domain: string, existing: readonly string[]): string | undefined {
  if (!domain) return 'Domain is required!';
  if (!emailSchema.safeParse(`test@${domain}`).success) return 'Invalid domain';
  if (existing.includes(domain)) return 'Domain already added';
  return undefined;
}

export const loginMethodSchema = z
  .object({ isActive: z.boolean(), clientId: z.string().trim(), whitelistEmail: z.array(z.string()) })
  .refine(values => !values.isActive || values.clientId !== '', {
    path: ['clientId'],
    message: 'Client Id is required!'
  });

export type LoginMethodForm = z.infer<typeof loginMethodSchema>;

export function toLoginMethodForm(method: GoogleLoginMethod): LoginMethodForm {
  return { isActive: method.isActive, clientId: method.clientId, whitelistEmail: [...method.whitelistEmail] };
}

/** The stored entry with the form's values; fields the form doesn't show are kept. */
export function toGoogleLoginMethod(base: GoogleLoginMethod, values: LoginMethodForm): GoogleLoginMethod {
  return { ...base, isActive: values.isActive, clientId: values.clientId, whitelistEmail: [...values.whitelistEmail] };
}
