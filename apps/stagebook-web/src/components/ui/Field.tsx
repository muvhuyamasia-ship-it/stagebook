import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function Field({ label, hint, error, children }: FieldProps) {
  return (
    <label className="sb-field">
      <span className="sb-field__label">{label}</span>
      {children}
      {hint && !error ? <span className="sb-field__hint">{hint}</span> : null}
      {error ? <span className="sb-field__error">{error}</span> : null}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="sb-input" {...props} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="sb-input sb-input--textarea" {...props} />;
}