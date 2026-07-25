import { UUID_RE } from "./constants";

export function isValidRecordRouteId(id: string | undefined): boolean {
  return Boolean(id && UUID_RE.test(id));
}
