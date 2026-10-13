"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

type OptionSelectProps = {
  id: string;
  name?: string;
  options: readonly { value: string; label: string }[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

/**
 * `Select` de shadcn para una lista simple de opciones. La envoltura evita que el `<select>`
 * oculto que Radix agrega para formularios reciba margenes del contenedor.
 */
export function OptionSelect({ id, name, options, defaultValue, value, onValueChange, disabled, className, ...aria }: OptionSelectProps) {
  return (
    <div className="relative">
      <Select name={name} defaultValue={defaultValue} value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger id={id} className={className} aria-label={aria["aria-label"]}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
