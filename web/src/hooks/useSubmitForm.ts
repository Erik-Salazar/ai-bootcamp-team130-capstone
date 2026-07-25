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
      const result = await submitRecord(toSubmitPayload(formData));
      setSuccess(result);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors.length > 0 ? err.errors : [{
          code: "REQUEST_FAILED",
          field: "",
          message: err.message || "Could not submit this record. Please try again.",
        }]);
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
