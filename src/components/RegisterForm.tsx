"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authErrorMessage } from "@/lib/authErrors";
import { hasErrors, MIN_PASSWORD_LENGTH, validateRegister, type FieldErrors } from "@/lib/validation";
import { useAuth } from "./AuthProvider";
import { Button } from "./Button";
import { FormAlert } from "./FormAlert";
import { PasswordField } from "./PasswordField";
import { TextField } from "./TextField";

export function RegisterForm() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<FieldErrors<"email" | "password" | "confirm">>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fieldErrors = validateRegister({ email, password, confirm });
    setErrors(fieldErrors);
    setFormError(null);
    if (hasErrors(fieldErrors)) return;

    setSubmitting(true);
    try {
      await signUp(email, password);
      router.replace("/panel");
    } catch (error) {
      setFormError(authErrorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Crea tu cuenta</h1>
      <p className="mt-1.5 text-sm text-slate-500">Empieza a facturar en un par de minutos. Sin tarjeta.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        {formError && <FormAlert message={formError} />}

        <TextField
          label="Email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="ana@empresa.es"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          error={errors.email}
        />

        <PasswordField
          label="Contraseña"
          name="password"
          autoComplete="new-password"
          hint={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          error={errors.password}
        />

        <PasswordField
          label="Repite la contraseña"
          name="confirm"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            setErrors((prev) => ({ ...prev, confirm: undefined }));
          }}
          error={errors.confirm}
        />

        <Button type="submit" className="w-full" loading={submitting}>
          Crear cuenta
        </Button>
      </form>

      <p className="mt-10 text-center text-sm text-slate-600">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
