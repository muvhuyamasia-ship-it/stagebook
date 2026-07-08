import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes
} from "react";

function FieldShell({
  label,
  hint,
  children
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}

export function Field(props: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const { label, hint, className = "", ...rest } = props;
  return (
    <FieldShell label={label} hint={hint}>
      <input className={`field__control ${className}`.trim()} {...rest} />
    </FieldShell>
  );
}

export function TextAreaField(
  props: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }
) {
  const { label, hint, className = "", ...rest } = props;
  return (
    <FieldShell label={label} hint={hint}>
      <textarea className={`field__control field__control--textarea ${className}`.trim()} {...rest} />
    </FieldShell>
  );
}

export function SelectField(
  props: SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string }
) {
  const { label, hint, className = "", children, ...rest } = props;
  return (
    <FieldShell label={label} hint={hint}>
      <select className={`field__control ${className}`.trim()} {...rest}>
        {children}
      </select>
    </FieldShell>
  );
}
