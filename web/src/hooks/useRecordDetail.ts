import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ApiError, getRecord, retryRecord, type ApiRecordDetail } from "../api-client";
import { isValidRecordRouteId } from "../lib/validation/route-id";

export type RecordRetryMessage = { type: "success" | "error"; text: string } | null;

export function useRecordDetail() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<ApiRecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState<RecordRetryMessage>(null);

  const load = useCallback(async () => {
    if (!id) {
      setRecord(null);
      setLoadError("No record ID provided.");
      setLoading(false);
      return;
    }

    if (!isValidRecordRouteId(id)) {
      setRecord(null);
      setLoadError("This record link is invalid. Check the URL and try again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const data = await getRecord(id);
      setRecord(data);
    } catch (err) {
      setRecord(null);
      if (err instanceof ApiError && err.status === 404) {
        setLoadError("Record not found. It may have been deleted or the ID is incorrect.");
      } else {
        setLoadError("Could not load this record. Make sure the API is running at the configured URL.");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function retryAnchor() {
    if (!id) return;

    setRetrying(true);
    setRetryMessage(null);

    try {
      await retryRecord(id);
      await load();
      setRetryMessage({ type: "success", text: "Retry queued — record moved back to pending." });
    } catch {
      setRetryMessage({
        type: "error",
        text: "Could not retry this record. Please try again.",
      });
    } finally {
      setRetrying(false);
    }
  }

  return {
    id,
    record,
    loading,
    loadError,
    retrying,
    retryMessage,
    refresh: load,
    retryAnchor,
  };
}
