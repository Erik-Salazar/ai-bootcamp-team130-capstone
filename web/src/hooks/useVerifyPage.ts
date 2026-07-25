import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { verifyById, verifyJson, type VerifyResponse } from "../api-client";
import { MAX_JSON_TEXT_CHARS } from "../lib/security/constants";
import { parseRecordJson } from "../lib/verify/parse-json";
import { formatValidationErrors } from "../lib/validation/format-errors";
import { isValidRecordRouteId } from "../lib/validation/route-id";
import { validateVerifyRecord } from "../lib/validation/verify-record";

export function useVerifyPage() {
  const { id } = useParams<{ id?: string }>();
  const [loading, setLoading] = useState(Boolean(id));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResponse | null>(null);

  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonSubmitting, setJsonSubmitting] = useState(false);

  const loadById = useCallback(async (recordId: string) => {
    if (!isValidRecordRouteId(recordId)) {
      setLoading(false);
      setLoadError("This verification link is invalid. Check the URL and try again.");
      return;
    }

    setLoading(true);
    setLoadError(null);
    setResult(null);

    try {
      const response = await verifyById(recordId);
      setResult(response);
    } catch {
      setLoadError("Could not load verification result. Make sure the API is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    loadById(id);
  }, [id, loadById]);

  async function verifyPastedJson() {
    const parsed = parseRecordJson(jsonText);
    if ("error" in parsed) {
      setJsonError(parsed.error);
      return;
    }

    const validationErrors = validateVerifyRecord(parsed.data);
    if (validationErrors.length > 0) {
      setJsonError(formatValidationErrors(validationErrors));
      return;
    }

    setJsonError(null);
    setJsonSubmitting(true);

    try {
      const response = await verifyJson(parsed.data);
      setResult(response);
    } catch {
      setJsonError("Could not verify this record. Make sure the API is running.");
    } finally {
      setJsonSubmitting(false);
    }
  }

  function handleFileUpload(file: File) {
    const isJsonFile = file.name.toLowerCase().endsWith(".json") || file.type === "application/json";
    if (!isJsonFile) {
      setJsonError("Please upload a .json file.");
      return;
    }

    if (file.size > MAX_JSON_TEXT_CHARS) {
      setJsonError("JSON file must be smaller than 256 KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setJsonText(reader.result);
        setJsonError(null);
      }
    };
    reader.onerror = () => {
      setJsonError("Could not read the file. Try a plain .json file.");
    };
    reader.readAsText(file);
  }

  function resetJsonForm() {
    setJsonText("");
    setJsonError(null);
    setResult(null);
  }

  function setJsonTextSafe(value: string) {
    setJsonText(value.slice(0, MAX_JSON_TEXT_CHARS));
    setJsonError(null);
  }

  return {
    id,
    loading,
    loadError,
    result,
    jsonText,
    setJsonText: setJsonTextSafe,
    jsonError,
    jsonSubmitting,
    verifyPastedJson,
    handleFileUpload,
    resetJsonForm,
    clearResult: () => setResult(null),
  };
}
