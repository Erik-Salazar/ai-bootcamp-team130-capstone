import VerifyHeader from "../components/verify/VerifyHeader";
import VerifyHowItWorks from "../components/verify/VerifyHowItWorks";
import VerifyJsonPanel from "../components/verify/VerifyJsonPanel";
import VerifyLoading from "../components/verify/VerifyLoading";
import VerifyResult from "../components/verify/VerifyResult";
import { useVerifyPage } from "../hooks/useVerifyPage";

export default function Verify() {
  const {
    id,
    loading,
    loadError,
    result,
    jsonText,
    setJsonText,
    jsonError,
    jsonSubmitting,
    verifyPastedJson,
    handleFileUpload,
    resetJsonForm,
  } = useVerifyPage();

  const showJsonPanel = !id;
  const showHowItWorks = showJsonPanel && !result && !loading;

  return (
    <section className="verify-page verify-page--narrow">
      <VerifyHeader showBackLink={Boolean(id)} />

      {showHowItWorks && <VerifyHowItWorks />}

      {loadError && (
        <div className="verify-banner verify-banner--error" role="alert">
          {loadError}
        </div>
      )}

      {loading && <VerifyLoading />}

      {!loading && result && (
        <VerifyResult result={result} />
      )}

      {showJsonPanel && (
        <VerifyJsonPanel
          jsonText={jsonText}
          error={jsonError}
          submitting={jsonSubmitting}
          onJsonChange={setJsonText}
          onFileUpload={handleFileUpload}
          onSubmit={verifyPastedJson}
          onClear={resetJsonForm}
        />
      )}
    </section>
  );
}
