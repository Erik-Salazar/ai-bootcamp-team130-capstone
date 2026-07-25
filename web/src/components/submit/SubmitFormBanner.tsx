interface SubmitFormBannerProps {
  messages: string[];
}

export default function SubmitFormBanner({ messages }: SubmitFormBannerProps) {
  if (messages.length === 0) return null;

  return (
    <div className="form-banner form-banner--error" role="alert">
      <span className="banner-icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        </svg>
      </span>
      <div>
        {messages.map((message) => (
          <p key={message}>{message}</p>
        ))}
      </div>
    </div>
  );
}
