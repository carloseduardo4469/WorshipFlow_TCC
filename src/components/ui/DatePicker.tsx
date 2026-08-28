"use client";

import { useEffect, useRef, useState } from "react";

type DatePickerProps = {
  name: string;
  defaultValue?: string | null;
  required?: boolean;
};

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function parseDate(value?: string | null) {
  if (!value) return { year: "", month: "", day: "" };
  const [year, month, day] = value.split("-");
  return { year: year ?? "", month: month ?? "", day: day ?? "" };
}

function daysInMonth(year: string, month: string) {
  if (!year || !month) return 31;
  return new Date(Number(year), Number(month), 0).getDate();
}

function todayParts() {
  const today = new Date();
  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
  };
}
  function WheelColumn({
    label,
    options,
    value,
    onChange,
  }: {
    label: string;
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
  }) {
    const listRef = useRef<HTMLDivElement>(null);
    const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));

    useEffect(() => {
      listRef.current?.scrollTo({ top: selectedIndex * 40, behavior: "auto" });
    }, [selectedIndex, options.length]);

    function handleScroll() {
      if (!listRef.current) return;
      const index = Math.round(listRef.current.scrollTop / 40);
      const option = options[index];
      if (option && option.value !== value) onChange(option.value);
    }

    return (
      <div className="db-wheel-column">
        <span className="db-wheel-label">{label}</span>
        <div ref={listRef} className="db-wheel-list" onScroll={handleScroll} role="listbox" aria-label={label}>
          <div className="db-wheel-spacer" />
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                listRef.current?.scrollTo({ top: options.indexOf(option) * 40, behavior: "smooth" });
              }}
              className="db-wheel-option"
            >
              {option.label}
            </button>
          ))}
          <div className="db-wheel-spacer" />
        </div>
      </div>
    );
  }

export function DatePicker({ name, defaultValue, required = false }: DatePickerProps) {
  const initial = parseDate(defaultValue);
  const currentYear = todayParts().year;
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [day, setDay] = useState(initial.day);

  const maxDay = daysInMonth(year, month);
  const selectedDay = day && Number(day) <= maxDay ? day : "";
  const dateValue = year && month && selectedDay
    ? `${year}-${month.padStart(2, "0")}-${selectedDay.padStart(2, "0")}`
    : "";
  const years = Array.from({ length: 6 }, (_, index) => String(currentYear + index));
  const today = todayParts();
  const firstDay = year === String(today.year) && month === String(today.month).padStart(2, "0") ? today.day : 1;
  const days = Array.from({ length: maxDay - firstDay + 1 }, (_, index) => String(firstDay + index).padStart(2, "0"));
  const availableMonths = year === String(currentYear)
    ? MONTHS.slice(today.month - 1)
    : MONTHS;

  function updateYear(value: string) {
    setYear(value);
    if (value && month && day && Number(day) > daysInMonth(value, month)) setDay("");
  }

  function updateMonth(value: string) {
    setMonth(value);
    if (value && year && day && Number(day) > daysInMonth(year, value)) setDay("");
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="db-label">Data</span>
      <input type="hidden" name={name} value={dateValue} required={required} />
        <div className="db-date-wheel grid grid-cols-3 gap-2">
          <WheelColumn label="Dia" options={[
            { value: "", label: "--" },
            ...days.map((value) => ({ value, label: String(Number(value)) })),
          ]} value={selectedDay} onChange={setDay} />
          <WheelColumn label="Mês" options={[
            { value: "", label: "--" },
            ...availableMonths.map((label) => ({ value: String(MONTHS.indexOf(label) + 1).padStart(2, "0"), label })),
          ]} value={month} onChange={updateMonth} />
          <WheelColumn label="Ano" options={[
            { value: "", label: "----" },
            ...years.map((value) => ({ value, label: value })),
          ]} value={year} onChange={updateYear} />
        </div>
      </div>
  );
}
