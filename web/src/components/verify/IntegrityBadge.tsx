import { INTEGRITY_LABELS, type IntegrityStatus } from "../../lib/verify/messages";

const INTEGRITY_CLASS: Record<IntegrityStatus, string> = {
  verified: "integrity-badge--verified",
  mismatch: "integrity-badge--mismatch",
  not_found: "integrity-badge--neutral",
  not_anchored: "integrity-badge--pending",
};

export default function IntegrityBadge({ integrity }: { integrity: IntegrityStatus }) {
  return (
    <span className={`integrity-badge ${INTEGRITY_CLASS[integrity]}`}>
      {INTEGRITY_LABELS[integrity]}
    </span>
  );
}
