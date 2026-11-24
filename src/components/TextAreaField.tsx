"use client";

import { useId, type TextareaHTMLAttributes } from "react";

interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  label: string;
  error?: string;
}

export function TextAreaField({ label, error, className = "", ...textareaProps }: TextAreaFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`block min-h-24 w-full rounded-xl border bg-white px-3.5 py-2.5 text-[15px] text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:ring-4 focus:outline-none ${
          error
            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15"
            : "border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/15"
        }`}
        {...textareaProps}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
