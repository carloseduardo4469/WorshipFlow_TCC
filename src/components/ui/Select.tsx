"use client";

import { Children, isValidElement, type ReactNode, useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  id?: string;
  name: string;
  defaultValue?: string | number | null;
  value?: string | number | null;
  onValueChange?: (value: string) => void;
  className?: string;
  menuClassName?: string;
  "aria-label"?: string;
  options?: SelectOption[];
  children?: ReactNode;
};

export function Select({ id, name, defaultValue = "", value: controlledValue, onValueChange, className = "", menuClassName = "", options: providedOptions, children, ...ariaProps }: SelectProps) {
  const childOptions = Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ value?: string | number; children?: ReactNode }>(child)) return [];
    return [{
      value: String(child.props.value ?? ""),
      label: String(child.props.children ?? ""),
    }];
  });
  const options = providedOptions ?? childOptions;
  const [internalValue, setInternalValue] = useState(String(defaultValue ?? ""));
  const value = controlledValue === undefined ? internalValue : String(controlledValue ?? "");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    function closeOnOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function closeOnScroll() {
      setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("scroll", closeOnScroll, { passive: true });
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("scroll", closeOnScroll);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input type="hidden" name={name} value={value} />
      <button
        id={id}
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        className={`db-select flex items-center justify-between text-left ${className}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        {...ariaProps}
      >
        <span className="truncate">{selected?.label ?? ""}</span>
        <ChevronDown size={16} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className={`db-select-menu ${menuClassName}`} role="listbox" aria-labelledby={id}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                setInternalValue(option.value);
                onValueChange?.(option.value);
                setOpen(false);
              }}
              className="db-select-option flex items-center justify-between gap-3"
            >
              <span className="truncate">{option.label}</span>
              {option.value === value && <Check size={15} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
