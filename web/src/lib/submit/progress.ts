import { REQUIRED_FIELD_COUNT, REQUIRED_SUBMIT_FIELDS } from "./constants";
import type { SubmitFormData } from "./types";

export function getSubmitProgress(form: SubmitFormData) {
  const filled = REQUIRED_SUBMIT_FIELDS.filter((key) => form[key].trim() !== "").length;

  return {
    filled,
    total: REQUIRED_FIELD_COUNT,
    allRequiredFilled: filled === REQUIRED_FIELD_COUNT,
  };
}
