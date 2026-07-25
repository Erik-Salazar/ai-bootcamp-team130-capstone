import { useState, type FormEvent } from "react";
import {
  submitRecord,
  ApiError,
  type SubmitRecordResponse,
  type ApiValidationError,
} from "../api-client";
import { INITIAL_SUBMIT_FORM } from "../lib/submit/constants";
import { toSubmitPayload } from "../lib/submit/payload";
import type { SubmitFormData } from "../lib/submit/types";
import {
  MAX_EQUIPMENT_LABEL_LENGTH,
  MAX_NOTES_LENGTH,
  MAX_RECORD_ID_LENGTH,
  MAX_SHOP_NAME_LENGTH,
} from "../lib/security/constants";
import { sanitizeMultilineText, sanitizeText } from "../lib/security/sanitize-text";
import { focusFirstField } from "../lib/validation/format-errors";
import { validateSubmitForm } from "../lib/validation/submit";
import { normalizeVin } from "../lib/validation/vin";

function sanitizeFormField(name: string, value: string): string {
  switch (name) {
    case "record_id":
      return sanitizeText(value, MAX_RECORD_ID_LENGTH);
    case "vin":
      return normalizeVin(value).slice(0, 17);
    case "equipment_label":
      return sanitizeText(value, MAX_EQUIPMENT_LABEL_LENGTH);
    case "shop_name":
      return sanitizeText(value, MAX_SHOP_NAME_LENGTH);
    case "notes":
      return sanitizeMultilineText(value, MAX_NOTES_LENGTH);
    default:
      return value;
  }
}

export function useSubmitForm() {
  const [formData, setFormData] = useState<SubmitFormData>(INITIAL_SUBMIT_FORM);
  const [errors, setErrors] = useState<ApiValidationError[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SubmitRecordResponse | null>(null);

  function fieldError(field: string) {
    return errors.find((e) => e.field === field)?.message;
  }

  function clearFieldError(field: string) {
    setErrors((prev) => prev.filter((err) => err.field !== field));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    const nextValue = sanitizeFormField(name, value);
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    clearFieldError(name);
  }

  function setFieldValue<K extends keyof SubmitFormData>(field: K, value: SubmitFormData[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearFieldError(field);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors([]);

    const clientErrors = validateSubmitForm(formData);
    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      focusFirstField(clientErrors);
      return;
    }

    setSubmitting(true);

    try {
      const result = await submitRecord(toSubmitPayload(formData));
      setSuccess(result);
    } catch (err) {
      if (err instanceof ApiError) {
        const apiErrors = err.errors.length > 0 ? err.errors : [{
          code: "REQUEST_FAILED",
          field: "",
          message: err.message || "Could not submit this record. Please try again.",
        }];
        setErrors(apiErrors);
        focusFirstField(apiErrors);
      } else {
        setErrors([{
          code: "NETWORK_ERROR",
          field: "",
          message: "Could not reach the server. Please try again.",
        }]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setFormData(INITIAL_SUBMIT_FORM);
    setErrors([]);
    setSuccess(null);
  }

  const globalErrors = errors.filter((e) => !e.field);

  return {
    formData,
    errors,
    globalErrors,
    submitting,
    success,
    fieldError,
    handleChange,
    setFieldValue,
    handleSubmit,
    resetForm,
  };
}
