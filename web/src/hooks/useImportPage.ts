import { useMemo, useState } from "react";
import { ApiError, importRecord, type SubmitRecordResponse } from "../api-client";
import { mapWebhookToCanonical } from "../lib/import/map-webhook";
import { parseImportWebhook } from "../lib/import/parse-webhook";
import { MAX_JSON_TEXT_CHARS } from "../lib/security/constants";

export function useImportPage() {
  const [jsonText, setJsonTextState] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SubmitRecordResponse | null>(null);

  const parsed = useMemo(() => {
    if (!jsonText.trim()) return null;
    const result = parseImportWebhook(jsonText);
    return "data" in result ? result.data : null;
  }, [jsonText]);

  const preview = useMemo(
    () => (parsed ? mapWebhookToCanonical(parsed) : null),
    [parsed],
  );

  function setJsonText(value: string) {
    setJsonTextState(value.slice(0, MAX_JSON_TEXT_CHARS));
    setParseError(null);
    setSubmitError(null);
    setSuccess(null);
  }

  function handleFileUpload(file: File) {
    const isJsonFile = file.name.toLowerCase().endsWith(".json") || file.type === "application/json";
    if (!isJsonFile) {
      setParseError("Please upload a .json file.");
      return;
    }

    if (file.size > MAX_JSON_TEXT_CHARS) {
      setParseError("JSON file must be smaller than 256 KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setJsonText(reader.result);
      }
    };
    reader.onerror = () => {
      setParseError("Could not read the file. Try a plain .json file.");
    };
    reader.readAsText(file);
  }

  function clearForm() {
    setJsonTextState("");
    setParseError(null);
    setSubmitError(null);
    setSuccess(null);
  }

  async function submitImport() {
    const result = parseImportWebhook(jsonText);
    if ("error" in result) {
      setParseError(result.error);
      return;
    }

    setParseError(null);
    setSubmitError(null);
    setSubmitting(true);

    try {
      const response = await importRecord(result.data);
      setSuccess(response);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(
          err.errors[0]?.message ?? err.message ?? "Could not import this record. Please try again.",
        );
      } else {
        setSubmitError("Could not reach the server. Make sure the API is running.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return {
    jsonText,
    setJsonText,
    parseError,
    submitError,
    submitting,
    success,
    preview,
    canSubmit: Boolean(preview),
    handleFileUpload,
    clearForm,
    submitImport,
    resetSuccess: () => {
      setSuccess(null);
      clearForm();
    },
  };
}
