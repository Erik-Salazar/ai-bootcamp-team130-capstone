import { FIELD_HINTS, FIELD_LABELS } from "../../lib/field-labels";
import { SERVICE_TYPES } from "../../lib/submit/constants";
import type { SubmitFormData } from "../../lib/submit/types";
import CustomSelect from "./CustomSelect";
import DateTimePicker from "./DateTimePicker";
import FormField from "./FormField";
import FormSectionHeader from "./FormSectionHeader";

interface ServiceSectionProps {
  formData: SubmitFormData;
  fieldError: (field: string) => string | undefined;
  onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onFieldChange: <K extends keyof SubmitFormData>(field: K, value: SubmitFormData[K]) => void;
}

export default function ServiceSection({
  formData,
  fieldError,
  onChange,
  onFieldChange,
}: ServiceSectionProps) {
  return (
    <>
      <FormSectionHeader
        title="Service Details"
        icon={
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
          </svg>
        }
      />
      <div className="form-body">
        <div className="form-row form-row--half">
          <FormField
            id="service_type"
            label={FIELD_LABELS.service_type}
            required
            error={fieldError("service_type")}
          >
            <CustomSelect
              id="service_type"
              name="service_type"
              value={formData.service_type}
              options={[...SERVICE_TYPES]}
              placeholder="Select service type…"
              onChange={(val) => onFieldChange("service_type", val)}
              required
              invalid={!!fieldError("service_type")}
            />
          </FormField>

          <FormField
            id="completed_at"
            label={FIELD_LABELS.completed_at}
            required
            hint={FIELD_HINTS.completed_at}
            error={fieldError("completed_at")}
          >
            <DateTimePicker
              id="completed_at"
              name="completed_at"
              value={formData.completed_at}
              onChange={(val) => onFieldChange("completed_at", val)}
              required
              invalid={!!fieldError("completed_at")}
            />
          </FormField>
        </div>

        <FormField id="shop_name" label={FIELD_LABELS.shop_name} required error={fieldError("shop_name")}>
          <input
            id="shop_name"
            name="shop_name"
            type="text"
            placeholder="In-house shop, Dallas Service Center…"
            value={formData.shop_name}
            onChange={onChange}
            aria-invalid={!!fieldError("shop_name")}
            required
          />
        </FormField>

        <FormField id="equipment_label" label={FIELD_LABELS.equipment_label} hint={FIELD_HINTS.equipment_label}>
          <input
            id="equipment_label"
            name="equipment_label"
            type="text"
            placeholder="Truck 104"
            value={formData.equipment_label}
            onChange={onChange}
          />
        </FormField>

        <FormField id="notes" label={FIELD_LABELS.notes} hint={FIELD_HINTS.notes}>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Brief summary of work performed…"
            value={formData.notes}
            onChange={onChange}
          />
        </FormField>
      </div>
    </>
  );
}
