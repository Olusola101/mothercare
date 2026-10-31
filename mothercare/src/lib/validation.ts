import { z } from 'zod';

export const registerSchema = z.object({
  displayName: z.string().trim().min(1, 'Please enter a name.').max(60, 'Please use 60 characters or fewer.'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(254, 'That email address is too long.'),
  password: z.string().min(10, 'Use at least 10 characters.').max(128, 'Use 128 characters or fewer.'),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Please confirm to continue.' }) }),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

/** First error message per field. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

/** Only allow same-site relative redirects after sign-in. */
export function safeRedirect(target: unknown): string {
  return typeof target === 'string' && target.startsWith('/') && !target.startsWith('//') ? target : '/';
}
