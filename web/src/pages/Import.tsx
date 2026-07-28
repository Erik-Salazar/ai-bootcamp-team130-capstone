import ImportHeader from "../components/import/ImportHeader";
import ImportPreviewCard from "../components/import/ImportPreviewCard";
import ImportWebhookPanel from "../components/import/ImportWebhookPanel";
import SubmitSuccess from "../components/submit/SubmitSuccess";
import { useImportPage } from "../hooks/useImportPage";

export default function Import() {
  const {
    jsonText,
    setJsonText,
    parseError,
    submitError,
    submitting,
    success,
    preview,
    canSubmit,
    handleFileUpload,
    clearForm,
    submitImport,
    resetSuccess,
  } = useImportPage();

  if (success) {
    return (
      <section className="import-page import-page--narrow">
        <SubmitSuccess result={success} onReset={resetSuccess} />
      </section>
    );
  }

  return (
    <section className="import-page import-page--narrow">
      <ImportHeader />

      <ImportWebhookPanel
        jsonText={jsonText}
        error={parseError}
        canPreview={canSubmit}
        onJsonChange={setJsonText}
        onFileUpload={handleFileUpload}
        onClear={clearForm}
      />

      {preview && (
        <ImportPreviewCard
          preview={preview}
          submitting={submitting}
          submitError={submitError}
          onSubmit={submitImport}
        />
      )}
    </section>
  );
}
