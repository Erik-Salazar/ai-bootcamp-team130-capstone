import SubmitForm from "../components/submit/SubmitForm";
import SubmitHeader from "../components/submit/SubmitHeader";
import SubmitSuccess from "../components/submit/SubmitSuccess";
import { useSubmitForm } from "../hooks/useSubmitForm";

export default function Submit() {
  const {
    formData,
    globalErrors,
    submitting,
    success,
    fieldError,
    handleChange,
    setFieldValue,
    handleSubmit,
    resetForm,
  } = useSubmitForm();

  if (success) {
    return (
      <section className="page page--narrow">
        <SubmitSuccess result={success} onReset={resetForm} />
      </section>
    );
  }

  return (
    <section className="page page--narrow">
      <SubmitHeader />
      <SubmitForm
        formData={formData}
        globalErrors={globalErrors}
        submitting={submitting}
        fieldError={fieldError}
        onChange={handleChange}
        onFieldChange={setFieldValue}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
