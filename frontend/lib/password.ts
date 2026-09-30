// Misma política que el backend (backend/app/auth.py → check_password_strength)
// y la app (mobile/src/lib/password.ts).
export const PASSWORD_RULES: { label: string; test: (p: string) => boolean }[] = [
  { label: '10 caracteres o más', test: (p) => p.length >= 10 },
  { label: 'Una mayúscula', test: (p) => /\p{Lu}/u.test(p) },
  { label: 'Una minúscula', test: (p) => /\p{Ll}/u.test(p) },
  { label: 'Un número', test: (p) => /\d/.test(p) },
  { label: 'Un símbolo (!@#$…)', test: (p) => /[^\p{L}\p{N}\s]/u.test(p) },
];

export const isStrongPassword = (p: string) => PASSWORD_RULES.every((r) => r.test(p));
