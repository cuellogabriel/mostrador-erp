"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authErrorMessage } from "@/lib/authErrors";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo";
import { hasErrors, validateLogin, type FieldErrors } from "@/lib/validation";
import { useAuth } from "./AuthProvider";
import { Button } from "./Button";
import { FormAlert } from "./FormAlert";
import { PasswordField } from "./PasswordField";
import { TextField } from "./TextField";

export function LoginForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors<"email" | "password">>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"form" | "demo" | null>(null);

  async function submit(nextEmail: string, nextPassword: string, source: "form" | "demo") {
    const fieldErrors = validateLogin({ email: nextEmail, password: nextPassword });
    setErrors(fieldErrors);
    setFormError(null);
    if (hasErrors(fieldErrors)) return;

    setSubmitting(source);
    try {
      await signIn(nextEmail, nextPassword);
      router.replace("/panel");
    } catch (error) {
      setFormError(authErrorMessage(error));
      setSubmitting(null);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit(email, password, "form");
  }

  function handleDemo() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    void submit(DEMO_EMAIL, DEMO_PASSWORD, "demo");
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Inicia sesión</h1>
      <p className="mt-1.5 text-sm text-slate-500">Entra para ver tus facturas, clientes y stock.</p>

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
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          error={errors.password}
        />

        <Button type="submit" className="w-full" loading={submitting === "form"} disabled={submitting !== null}>
          Entrar
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-slate-500">
        <span className="h-px flex-1 bg-slate-200" />o<span className="h-px flex-1 bg-slate-200" />
      </div>

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={handleDemo}
        loading={submitting === "demo"}
        disabled={submitting !== null}
      >
        {submitting !== "demo" && <Sparkles className="size-4 text-emerald-600" aria-hidden="true" />}
        Entrar con la cuenta demo
      </Button>
      <p className="mt-2 text-center text-xs text-slate-500">
        Usa <span className="font-medium text-slate-600">{DEMO_EMAIL}</span> para probar sin registrarte.
      </p>

      <p className="mt-10 text-center text-sm text-slate-600">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/registro" className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline">
          Crea una gratis
        </Link>
      </p>
    </div>
  );
}
