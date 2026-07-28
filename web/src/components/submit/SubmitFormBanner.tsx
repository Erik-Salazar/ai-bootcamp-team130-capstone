import PageBanner from "../PageBanner";

interface SubmitFormBannerProps {
  messages: string[];
}

export default function SubmitFormBanner({ messages }: SubmitFormBannerProps) {
  if (messages.length === 0) return null;

  return (
    <PageBanner type="error">
      {messages.map((message) => (
        <p key={message} style={{ margin: 0 }}>{message}</p>
      ))}
    </PageBanner>
  );
}
