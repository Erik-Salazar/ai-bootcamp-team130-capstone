interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

export default function FormField({ id, label, required, hint, error, children }: FormFieldProps) {
  return (
    <div className="form-field">
      <label htmlFor={id}>
        {label} {required && <span className="required">*</span>}
      </label>
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
