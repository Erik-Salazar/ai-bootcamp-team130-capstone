interface Step {
  label: string;
  desc: string;
}

interface StepsBarProps {
  steps: Step[];
  activeIndex: number;
  doneUpTo?: number;
}

export default function StepsBar({ steps, activeIndex, doneUpTo = -1 }: StepsBarProps) {
  return (
    <div className="steps-bar">
      {steps.map((step, i) => {
        const isDone = i <= doneUpTo;
        const isActive = i === activeIndex;
        const cls = isDone ? "step step--done" : isActive ? "step step--active" : "step";
        return (
          <div key={step.label} className={cls}>
            <div className="step-dot">{isDone ? "✓" : i + 1}</div>
            <div className="step-text">
              <span className="step-label">{step.label}</span>
              <span className="step-desc">{step.desc}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
