"use client";

import { Children, isValidElement, type ReactNode, useEffect, useId, useRef, useState } from "react";
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
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const generatedId = useId();
  const buttonId = id ?? `${generatedId}-trigger`;
  const listboxId = `${buttonId}-listbox`;
  const selected = options.find((option) => option.value === value) ?? options[0];

  function choose(optionValue: string) {
    setInternalValue(optionValue);
    onValueChange?.(optionValue);
    setOpen(false);
    requestAnimationFrame(() => buttonRef.current?.focus());
  }

  function openAt(index: number) {
    const safeIndex = Math.min(Math.max(0, index), Math.max(0, options.length - 1));
    setActiveIndex(safeIndex);
    setOpen(true);
  }

  useEffect(() => {
    function closeOnOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
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

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => optionRefs.current[activeIndex]?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open, activeIndex]);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input type="hidden" name={name} value={value} />
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        onClick={() => {
          if (open) setOpen(false);
          else openAt(Math.max(0, options.findIndex((option) => option.value === value)));
        }}
        onKeyDown={(event) => {
          const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
          if (event.key === "ArrowDown") { event.preventDefault(); openAt(open ? activeIndex + 1 : selectedIndex); }
          if (event.key === "ArrowUp") { event.preventDefault(); openAt(open ? activeIndex - 1 : selectedIndex); }
          if (event.key === "Home") { event.preventDefault(); openAt(0); }
          if (event.key === "End") { event.preventDefault(); openAt(options.length - 1); }
        }}
        className={`db-select flex items-center justify-between text-left ${className}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        {...ariaProps}
      >
        <span className="truncate">{selected?.label ?? ""}</span>
        <ChevronDown size={16} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div id={listboxId} className={`db-select-menu ${menuClassName}`} role="listbox" aria-labelledby={buttonId}>
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              tabIndex={activeIndex === index ? 0 : -1}
              ref={(element) => { optionRefs.current[index] = element; }}
              onFocus={() => setActiveIndex(index)}
              onClick={() => choose(option.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((current) => Math.min(options.length - 1, current + 1)); }
                if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((current) => Math.max(0, current - 1)); }
                if (event.key === "Home") { event.preventDefault(); setActiveIndex(0); }
                if (event.key === "End") { event.preventDefault(); setActiveIndex(options.length - 1); }
                if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(option.value); }
                if (event.key === "Tab") setOpen(false);
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
