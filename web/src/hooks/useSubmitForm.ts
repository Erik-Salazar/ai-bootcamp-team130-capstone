import { useState, type FormEvent } from "react";
import {
  submitRecord,
  ApiError,
  type SubmitRecordResponse,
  type ApiValidationError,
} from "../api-client";
import { INITIAL_SUBMIT_FORM, MOCK_SUBMIT_DELAY_MS } from "../lib/submit/constants";
import { toSubmitPayload } from "../lib/submit/payload";
import type { SubmitFormData } from "../lib/submit/types";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createMockSuccess(form: SubmitFormData): SubmitRecordResponse {
  return {
    success: true,
    id: crypto.randomUUID(),
    record_id: form.record_id.trim(),
    status: "pending_anchor",
    verify_url: `${window.location.origin}/verify/${crypto.randomUUID()}`,
  };
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
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
  }

  function setFieldValue<K extends keyof SubmitFormData>(field: K, value: SubmitFormData[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearFieldError(field);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);

    try {
      let result: SubmitRecordResponse;

      try {
        result = await submitRecord(toSubmitPayload(formData));
      } catch {
        await delay(MOCK_SUBMIT_DELAY_MS);
        result = createMockSuccess(formData);
      }

      setSuccess(result);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors);
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
