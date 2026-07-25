import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { verifyById, verifyJson, type VerifyResponse } from "../api-client";
import { parseRecordJson } from "../lib/verify/parse-json";

export function useVerifyPage() {
  const { id } = useParams<{ id?: string }>();
  const [loading, setLoading] = useState(Boolean(id));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResponse | null>(null);

  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonSubmitting, setJsonSubmitting] = useState(false);

  const loadById = useCallback(async (recordId: string) => {
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

  return {
    id,
    loading,
    loadError,
    result,
    jsonText,
    setJsonText,
    jsonError,
    jsonSubmitting,
    verifyPastedJson,
    handleFileUpload,
    resetJsonForm,
    clearResult: () => setResult(null),
  };
}
