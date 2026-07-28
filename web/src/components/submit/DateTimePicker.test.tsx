import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DateTimePicker from "./DateTimePicker";

describe("DateTimePicker", () => {
  it("keeps the selected day/month/year when changing the time after browsing to a different month", () => {
    // Regression test: updateTime() used to combine the *currently browsed*
    // calendar month/year with the *previously selected* day, so paging
    // through months (without picking a new day) and then changing the
    // time would silently move the selected date into whichever month
    // happened to be in view.
    let value = "2026-03-15T09:00";
    const onChange = (next: string) => {
      value = next;
    };

    const { container } = render(
      <DateTimePicker id="completed_at" name="completed_at" value={value} onChange={onChange} />,
    );

    fireEvent.click(container.querySelector(".dtp__trigger")!);
    fireEvent.click(container.querySelector(".dtp__nav:last-of-type")!); // next month, no day re-selected

    const hourSelect = container.querySelectorAll("select")[0];
    fireEvent.change(hourSelect, { target: { value: "10" } });

    expect(value.startsWith("2026-03-15T10:")).toBe(true);
  });
});
