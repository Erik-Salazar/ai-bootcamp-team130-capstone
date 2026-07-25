import { useState, useRef, useEffect } from "react";

interface DateTimePickerProps {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  invalid?: boolean;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function formatDisplay(value: string) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function DateTimePicker({ id, name, value, onChange, required, invalid }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const selected = value ? new Date(value) : null;

  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? now.getMonth());
  const [hour, setHour] = useState(selected ? selected.getHours() : now.getHours());
  const [minute, setMinute] = useState(selected ? selected.getMinutes() : 0);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }

  function selectDay(day: number) {
    const d = new Date(viewYear, viewMonth, day, hour, minute);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    onChange(iso);
  }

  function selectToday() {
    const t = new Date();
    setViewYear(t.getFullYear());
    setViewMonth(t.getMonth());
    const iso = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    onChange(iso);
  }

  function updateTime(h: number, m: number) {
    setHour(h);
    setMinute(m);
    if (selected) {
      const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(selected.getDate()).padStart(2, "0")}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      onChange(iso);
    }
  }

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = daysInMonth(viewYear, viewMonth);
  const prevMonthDays = daysInMonth(viewYear, viewMonth - 1);

  const isToday = (day: number) => day === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear();
  const isSelected = (day: number) => selected && day === selected.getDate() && viewMonth === selected.getMonth() && viewYear === selected.getFullYear();

  const cells: { day: number; current: boolean }[] = [];
  for (let i = firstDayOfWeek - 1; i >= 0; i--) cells.push({ day: prevMonthDays - i, current: false });
  for (let d = 1; d <= totalDays; d++) cells.push({ day: d, current: true });
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) cells.push({ day: d, current: false });

  return (
    <div className={`dtp ${invalid ? "dtp--invalid" : ""}`} ref={ref}>
      <input type="hidden" name={name} value={value} required={required} />
      <button type="button" id={id} className="dtp__trigger" onClick={() => setOpen(!open)}>
        <span className={value ? "dtp__value" : "dtp__placeholder"}>
          {value ? formatDisplay(value) : "Select date & time…"}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {open && (
        <div className="dtp__popup">
          <div className="dtp__header">
            <button type="button" className="dtp__nav" onClick={prevMonth}>‹</button>
            <span className="dtp__title">{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" className="dtp__nav" onClick={nextMonth}>›</button>
          </div>

          <table className="dtp__grid">
            <thead>
              <tr>{DAYS.map((d) => <th key={d}>{d}</th>)}</tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }, (_, row) => (
                <tr key={row}>
                  {cells.slice(row * 7, row * 7 + 7).map((cell, col) => (
                    <td key={col}
                      className={`dtp__cell ${!cell.current ? "dtp__cell--other" : ""} ${cell.current && isToday(cell.day) ? "dtp__cell--today" : ""} ${cell.current && isSelected(cell.day) ? "dtp__cell--selected" : ""}`}
                      onClick={() => cell.current && selectDay(cell.day)}
                    >
                      {cell.day}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="dtp__time">
            <label>Time:</label>
            <select value={hour} onChange={(e) => updateTime(Number(e.target.value), minute)}>
              {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, "0")}</option>)}
            </select>
            <span>:</span>
            <select value={minute} onChange={(e) => updateTime(hour, Number(e.target.value))}>
              {Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, "0")}</option>)}
            </select>
          </div>

          <div className="dtp__footer">
            <button type="button" className="dtp__today" onClick={selectToday}>Today</button>
            <button type="button" className="dtp__done" onClick={() => setOpen(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
