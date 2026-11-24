const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export const MIN_PASSWORD_LENGTH = 6;

/** Comprobación de formato de email (no verifica que exista). */
export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

export function hasErrors<K extends string>(errors: FieldErrors<K>): boolean {
  return Object.values(errors).some(Boolean);
}

function emailError(email: string): string | undefined {
  if (!email.trim()) return "Escribe tu email.";
  if (!isValidEmail(email)) return "Escribe un email válido, por ejemplo ana@empresa.es.";
  return undefined;
}

export function validateLogin(input: { email: string; password: string }): FieldErrors<"email" | "password"> {
  const errors: FieldErrors<"email" | "password"> = {};
  const email = emailError(input.email);
  if (email) errors.email = email;
  if (!input.password) errors.password = "Escribe tu contraseña.";
  return errors;
}

export function validateRegister(input: {
  email: string;
  password: string;
  confirm: string;
}): FieldErrors<"email" | "password" | "confirm"> {
  const errors: FieldErrors<"email" | "password" | "confirm"> = {};
  const email = emailError(input.email);
  if (email) errors.email = email;
  if (!input.password) errors.password = "Elige una contraseña.";
  else if (input.password.length < MIN_PASSWORD_LENGTH)
    errors.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  if (!input.confirm) errors.confirm = "Repite la contraseña.";
  else if (input.confirm !== input.password) errors.confirm = "Las contraseñas no coinciden.";
  return errors;
}
