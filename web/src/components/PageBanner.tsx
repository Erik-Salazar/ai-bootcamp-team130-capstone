import type { ReactNode } from "react";

interface PageBannerProps {
  type: "error" | "success";
  children: ReactNode;
}

export default function PageBanner({ type, children }: PageBannerProps) {
  return (
    <div className={`page-banner page-banner--${type}`} role={type === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}
