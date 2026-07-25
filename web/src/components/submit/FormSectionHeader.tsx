import type { ReactNode } from "react";

interface FormSectionHeaderProps {
  icon: ReactNode;
  title: string;
}

export default function FormSectionHeader({ icon, title }: FormSectionHeaderProps) {
  return (
    <div className="form-section-header">
      <span className="section-icon">{icon}</span>
      {title}
    </div>
  );
}
