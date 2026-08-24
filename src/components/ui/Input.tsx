import { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string };

export function Input({ label, error, id, className = "", ...rest }: InputProps) {
  const inputId = id ?? rest.name;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="db-label">
        {label}
      </label>
      <input
        id={inputId}
        className={`db-input ${className}`}
        {...rest}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

export type CheckboxOption = { value: string; label: string };

type CheckboxGroupProps = {
  label: string;
  name: string;
  options: CheckboxOption[];
  defaultSelected?: string[];
};

export function CheckboxGroup({ label, name, options, defaultSelected = [] }: CheckboxGroupProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="db-label">{label}</legend>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-[color:rgba(148,163,184,0.16)] bg-[color:#0e1730] px-4 py-3">
        {options.map((option) => (
          <label key={option.value} className="flex cursor-pointer items-center gap-2 text-sm text-paper">
            <input
              type="checkbox"
              name={name}
              value={option.value}
              defaultChecked={defaultSelected.includes(option.value)}
              className="h-4 w-4 accent-amber"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
