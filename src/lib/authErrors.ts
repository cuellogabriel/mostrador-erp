const MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "El email o la contraseña no son correctos.",
  "auth/invalid-login-credentials": "El email o la contraseña no son correctos.",
  "auth/user-not-found": "El email o la contraseña no son correctos.",
  "auth/wrong-password": "El email o la contraseña no son correctos.",
  "auth/invalid-email": "El email no tiene un formato válido.",
  "auth/user-disabled": "Esta cuenta está desactivada.",
  "auth/email-already-in-use": "Ya existe una cuenta con ese email. Prueba a iniciar sesión.",
  "auth/weak-password": "La contraseña es demasiado débil: usa al menos 6 caracteres.",
  "auth/missing-password": "Escribe tu contraseña.",
  "auth/too-many-requests": "Demasiados intentos. Espera unos minutos y vuelve a probar.",
  "auth/network-request-failed": "No hay conexión. Revisa tu red e inténtalo de nuevo.",
  "auth/operation-not-allowed": "Este método de acceso no está habilitado.",
};

const FALLBACK = "No se ha podido completar la operación. Inténtalo de nuevo.";

/** Traduce un error de Firebase Auth a un mensaje en español para el usuario. */
export function authErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const { code } = error;
    if (typeof code === "string" && Object.hasOwn(MESSAGES, code)) return MESSAGES[code];
  }
  return FALLBACK;
}
