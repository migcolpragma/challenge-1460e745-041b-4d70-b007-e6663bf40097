import * as winston from 'winston';

export const SENSITIVE_KEYS = new Set([
  'password', 'passwd', 'secret', 'token', 'authorization', 'auth',
  'apikey', 'api_key', 'accesstoken', 'access_token', 'refreshtoken',
  'refresh_token', 'database_url', 'databaseurl', 'connectionstring',
  'curp', 'rfc', 'ssn', 'creditcard', 'credit_card', 'cardnumber', 'card_number',
]);

export const PARTIAL_MASK_KEYS = new Set([
  'applicantdocument', 'accountnumber', 'account_number', 'destinationaccount',
]);

export const TOKEN_PATTERN = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi;

export function maskPartial(value: string): string {
  if (value.length <= 4) return '****';
  return value.slice(0, 2) + '*'.repeat(value.length - 4) + value.slice(-4);
}

export function sanitize(obj: unknown, depth = 0): unknown {
  if (depth > 5 || obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return obj.replace(TOKEN_PATTERN, 'Bearer [REDACTED]');
  if (Array.isArray(obj)) return obj.map((item) => sanitize(item, depth + 1));
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => {
        const key = k.toLowerCase();
        if (SENSITIVE_KEYS.has(key)) return [k, '[REDACTED]'];
        if (PARTIAL_MASK_KEYS.has(key)) return [k, typeof v === 'string' ? maskPartial(v) : v];
        return [k, sanitize(v, depth + 1)];
      }),
    );
  }
  return obj;
}

export const sanitizeFormat = winston.format((info) => {
  const sanitized = sanitize(info) as typeof info;
  return Object.assign(info, sanitized);
})();
