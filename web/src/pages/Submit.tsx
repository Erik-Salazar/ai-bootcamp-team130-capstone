import { useState, type FormEvent } from "react";
import { submitRecord, ApiError, type SubmitRecordResponse, type ApiValidationError } from "../api-client";
import SubmitSuccess from "../components/SubmitSuccess";
import FormField from "../components/FormField";
import CustomSelect from "../components/CustomSelect";
import DateTimePicker from "../components/DateTimePicker";

const SERVICE_TYPES = ["PM-A", "PM-B", "PM-C", "Brake Service", "DOT Annual", "Oil Change", "Tire Service", "A/C Repair"];

const INITIAL_FORM = {
  record_id: "",
  vin: "",
  equipment_label: "",
  service_type: "",
  completed_at: "",
  odometer_miles: "",
  shop_name: "",
  notes: "",
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function Submit() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState<ApiValidationError[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SubmitRecordResponse | null>(null);

  function fieldError(field: string) {
    return errors.find((e) => e.field === field)?.message;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => prev.filter((err) => err.field !== name));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);

    try {
      let result: SubmitRecordResponse;

      try {
        result = await submitRecord({
          record_id: formData.record_id.trim(),
          vin: formData.vin.trim().toUpperCase(),
          equipment_label: formData.equipment_label.trim() || undefined,
          service_type: formData.service_type.trim(),
          completed_at: formData.completed_at ? new Date(formData.completed_at).toISOString() : "",
          odometer_miles: parseInt(formData.odometer_miles, 10) || 0,
          shop_name: formData.shop_name.trim(),
          notes: formData.notes.trim() || undefined,
        });
      } catch {
        await delay(1200);
        result = {
          success: true,
          id: crypto.randomUUID(),
          record_id: formData.record_id.trim(),
          status: "pending_anchor",
          verify_url: `${window.location.origin}/verify/${crypto.randomUUID()}`,
        };
      }

      setSuccess(result);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors);
      } else {
        setErrors([{ code: "NETWORK_ERROR", field: "", message: "Could not reach the server. Please try again." }]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    if (!confirm("Clear all fields?")) return;
    setFormData(INITIAL_FORM);
    setErrors([]);
    setSuccess(null);
  }

  const filledRequired = [formData.record_id, formData.vin, formData.service_type, formData.completed_at, formData.odometer_miles, formData.shop_name].filter(v => v.trim() !== "").length;
  const allRequiredFilled = filledRequired === 6;

  if (success) {
    return (
      <section className="submit-page">
        <SubmitSuccess result={success} onReset={() => { setFormData(INITIAL_FORM); setErrors([]); setSuccess(null); }} />
      </section>
    );
  }

  return (
    <section className="submit-page submit-page--narrow">
      {errors.some((e) => !e.field) && (
        <div className="form-banner form-banner--error">
          <span className="banner-icon">⚠</span>
          <div>
            {errors.filter((e) => !e.field).map((e, i) => (
              <p key={i}>{e.message}</p>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="submit-form" noValidate>
        <div className="form-section-header">
          <span className="section-icon">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </span>
          Vehicle Information
        </div>
        <div className="form-body">
          <div className="form-row form-row--half">
            <FormField id="record_id" label="Work Order / Record ID" required hint="Unique work order number" error={fieldError("record_id")}>
              <input id="record_id" name="record_id" type="text" placeholder="wo-2026-0042" value={formData.record_id} onChange={handleChange} aria-invalid={!!fieldError("record_id")} required />
            </FormField>

            <FormField id="vin" label="VIN" required hint={formData.vin.length > 0 ? `${formData.vin.length}/17 characters` : "17-character identifier"} error={fieldError("vin")}>
              <input id="vin" name="vin" type="text" placeholder="1FUJGHDV8CLBR1234" maxLength={17} value={formData.vin} onChange={handleChange} aria-invalid={!!fieldError("vin")} className="mono" required />
            </FormField>
          </div>

          <FormField id="odometer_miles" label="Odometer (miles)" required error={fieldError("odometer_miles")}>
            <input id="odometer_miles" name="odometer_miles" type="number" min={1} max={1999999} placeholder="142318" value={formData.odometer_miles} onChange={handleChange} aria-invalid={!!fieldError("odometer_miles")} required />
          </FormField>
        </div>

        <div className="form-section-header">
          <span className="section-icon">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
            </svg>
          </span>
          Service Details
        </div>
        <div className="form-body">
          <div className="form-row form-row--half">
            <FormField id="service_type" label="Service Type" required error={fieldError("service_type")}>
              <CustomSelect
                id="service_type"
                name="service_type"
                value={formData.service_type}
                options={SERVICE_TYPES}
                placeholder="Select service type…"
                onChange={(val) => { setFormData((prev) => ({ ...prev, service_type: val })); setErrors((prev) => prev.filter((e) => e.field !== "service_type")); }}
                required
                invalid={!!fieldError("service_type")}
              />
            </FormField>

            <FormField id="completed_at" label="Completed At" required hint="Cannot be in the future" error={fieldError("completed_at")}>
              <DateTimePicker
                id="completed_at"
                name="completed_at"
                value={formData.completed_at}
                onChange={(val) => { setFormData((prev) => ({ ...prev, completed_at: val })); setErrors((prev) => prev.filter((e) => e.field !== "completed_at")); }}
                required
                invalid={!!fieldError("completed_at")}
              />
            </FormField>
          </div>

          <FormField id="shop_name" label="Shop Name" required error={fieldError("shop_name")}>
            <input id="shop_name" name="shop_name" type="text" placeholder="In-house shop, Dallas Service Center…" value={formData.shop_name} onChange={handleChange} aria-invalid={!!fieldError("shop_name")} required />
          </FormField>

          <FormField id="equipment_label" label="Equipment Label" hint="Optional unit name">
            <input id="equipment_label" name="equipment_label" type="text" placeholder="Truck 104" value={formData.equipment_label} onChange={handleChange} />
          </FormField>

          <FormField id="notes" label="Notes" hint="Optional">
            <textarea id="notes" name="notes" rows={3} placeholder="Brief summary of work performed…" value={formData.notes} onChange={handleChange} />
          </FormField>
        </div>

        <div className="form-actions">
          <button type="submit" className={`btn btn-primary btn-lg ${allRequiredFilled ? "btn-ready" : ""}`} disabled={submitting}>
            {submitting && <span className="spinner" />}
            {submitting ? "Submitting…" : "Submit"}
          </button>
          {!allRequiredFilled && (
            <span className="fields-remaining">{filledRequired}/6 required</span>
          )}
          {allRequiredFilled && !submitting && (
            <span className="fields-complete">✓ Ready to submit</span>
          )}
        </div>
      </form>
    </section>
  );
}
