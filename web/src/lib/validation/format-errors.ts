import type { ApiValidationError } from "../../api-client";

export function formatValidationErrors(errors: ApiValidationError[]): string {
  return errors
    .map((error) => (error.field ? `${error.field}: ${error.message}` : error.message))
    .join(" ");
}

export function focusFirstField(errors: ApiValidationError[]) {
  const firstField = errors.find((error) => error.field)?.field;
  if (!firstField) return;

  window.requestAnimationFrame(() => {
    document.getElementById(firstField)?.focus();
  });
}
