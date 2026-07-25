import type { ReactNode } from "react";

interface StatCardProps {
  value: number;
  label: string;
  variant: "primary" | "success" | "warning" | "danger";
  active?: boolean;
  onClick?: () => void;
  icon: ReactNode;
}

export default function StatCard({ value, label, variant, active, onClick, icon }: StatCardProps) {
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={`stat-card stat-card--${variant}${active ? " stat-card--active" : ""}${onClick ? " stat-card--clickable" : ""}`}
      onClick={onClick}
      aria-pressed={onClick ? active : undefined}
    >
      <span className="stat-card__icon" aria-hidden="true">{icon}</span>
      <span className="stat-card__value">{value}</span>
      <span className="stat-card__label">{label}</span>
    </Tag>
  );
}
