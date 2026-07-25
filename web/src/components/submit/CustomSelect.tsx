import { useState, useRef, useEffect } from "react";

interface CustomSelectProps {
  id: string;
  name: string;
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (value: string) => void;
  required?: boolean;
  invalid?: boolean;
}

export default function CustomSelect({ id, name, value, options, placeholder, onChange, required, invalid }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open && focused >= 0) {
        onChange(options[focused]);
        setOpen(false);
      } else {
        setOpen(true);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setFocused((prev) => Math.min(prev + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocused((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className={`custom-select ${open ? "custom-select--open" : ""} ${invalid ? "custom-select--invalid" : ""}`} ref={ref}>
      <input type="hidden" name={name} value={value} required={required} />
      <button
        type="button"
        id={id}
        className="custom-select__trigger"
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={value ? "custom-select__value" : "custom-select__placeholder"}>
          {value || placeholder || "Select…"}
        </span>
        <svg className="custom-select__arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul className="custom-select__menu" role="listbox">
          {options.map((opt, i) => (
            <li
              key={opt}
              role="option"
              aria-selected={value === opt}
              className={`custom-select__option ${value === opt ? "custom-select__option--selected" : ""} ${focused === i ? "custom-select__option--focused" : ""}`}
              onMouseEnter={() => setFocused(i)}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {opt}
              {value === opt && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
