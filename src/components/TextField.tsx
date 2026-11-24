"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  error?: string;
  hint?: string;
  /** Contenido al final del input (por ejemplo, un botón de mostrar contraseña). */
  trailing?: ReactNode;
}

export function TextField({ label, error, hint, trailing, className = "", ...inputProps }: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint && !error ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`block h-11 w-full rounded-xl border bg-white px-3.5 text-[15px] text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-4 ${
            trailing ? "pr-11" : ""
          } ${
            error
              ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15"
              : "border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/15"
          }`}
          {...inputProps}
        />
        {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
      </div>
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
