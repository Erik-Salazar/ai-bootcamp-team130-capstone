import { FIELD_HINTS, FIELD_LABELS } from "../../lib/field-labels";
import type { SubmitFormData } from "../../lib/submit/types";
import FormField from "./FormField";
import FormSectionHeader from "./FormSectionHeader";

interface VehicleSectionProps {
  formData: SubmitFormData;
  fieldError: (field: string) => string | undefined;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}

export default function VehicleSection({ formData, fieldError, onChange }: VehicleSectionProps) {
  return (
    <>
      <FormSectionHeader
        title="Vehicle Information"
        icon={
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="1" y="3" width="15" height="13" rx="2" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
        }
      />
      <div className="form-body">
        <div className="form-row form-row--half">
          <FormField
            id="record_id"
            label={FIELD_LABELS.record_id}
            required
            hint={FIELD_HINTS.record_id}
            error={fieldError("record_id")}
          >
            <input
              id="record_id"
              name="record_id"
              type="text"
              placeholder="wo-2026-0042"
              value={formData.record_id}
              onChange={onChange}
              aria-invalid={!!fieldError("record_id")}
              required
            />
          </FormField>

          <FormField
            id="vin"
            label={FIELD_LABELS.vin}
            required
            hint={formData.vin.length > 0 ? `${formData.vin.length}/17 characters` : FIELD_HINTS.vin}
            error={fieldError("vin")}
          >
            <input
              id="vin"
              name="vin"
              type="text"
              placeholder="1FUJGHDV8CLBR1234"
              maxLength={17}
              value={formData.vin}
              onChange={onChange}
              aria-invalid={!!fieldError("vin")}
              className="mono"
              required
            />
          </FormField>
        </div>

        <FormField
          id="odometer_miles"
          label={FIELD_LABELS.odometer_miles}
          required
          error={fieldError("odometer_miles")}
        >
          <input
            id="odometer_miles"
            name="odometer_miles"
            type="number"
            min={1}
            max={1999999}
            placeholder="142318"
            value={formData.odometer_miles}
            onChange={onChange}
            aria-invalid={!!fieldError("odometer_miles")}
            required
          />
        </FormField>
      </div>
    </>
  );
}
