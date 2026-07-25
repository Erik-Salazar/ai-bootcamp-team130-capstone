import type { FormEvent } from "react";
import { getSubmitProgress } from "../../lib/submit/progress";
import type { SubmitFormData } from "../../lib/submit/types";
import ServiceSection from "./ServiceSection";
import SubmitFormActions from "./SubmitFormActions";
import SubmitFormBanner from "./SubmitFormBanner";
import VehicleSection from "./VehicleSection";

interface SubmitFormProps {
  formData: SubmitFormData;
  globalErrors: { message: string }[];
  submitting: boolean;
  fieldError: (field: string) => string | undefined;
  onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onFieldChange: <K extends keyof SubmitFormData>(field: K, value: SubmitFormData[K]) => void;
  onSubmit: (e: FormEvent) => void;
}

export default function SubmitForm({
  formData,
  globalErrors,
  submitting,
  fieldError,
  onChange,
  onFieldChange,
  onSubmit,
}: SubmitFormProps) {
  const { filled, total, allRequiredFilled } = getSubmitProgress(formData);

  return (
    <>
      <SubmitFormBanner messages={globalErrors.map((e) => e.message)} />

      <form onSubmit={onSubmit} className="submit-form" noValidate>
        <VehicleSection formData={formData} fieldError={fieldError} onChange={onChange} />
        <ServiceSection
          formData={formData}
          fieldError={fieldError}
          onChange={onChange}
          onFieldChange={onFieldChange}
        />
        <SubmitFormActions
          submitting={submitting}
          filledRequired={filled}
          totalRequired={total}
          allRequiredFilled={allRequiredFilled}
        />
      </form>
    </>
  );
}
