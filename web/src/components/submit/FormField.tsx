import React from "react";

interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

export default function FormField({ id, label, required, hint, error, children }: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, !error && hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`form-field${error ? " form-field--invalid" : ""}`}>
      <label htmlFor={id}>
        {label} {required && <span className="required">*</span>}
      </label>
      {describedBy
        ? React.cloneElement(children as React.ReactElement, {
            "aria-describedby": describedBy,
          })
        : children}
      {hint && !error && <span id={hintId} className="field-hint">{hint}</span>}
      {error && <span id={errorId} className="field-error" role="alert">{error}</span>}
    </div>
  );
}
