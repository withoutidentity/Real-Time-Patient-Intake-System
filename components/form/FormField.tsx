"use client";

import { clsx } from "clsx";
import type { ChangeEventHandler, FocusEventHandler } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

type Option = {
  label: string;
  value: string;
};

type FormFieldProps = {
  id: string;
  label: string;
  type?: "text" | "email" | "tel" | "date";
  inputMode?: "text" | "email" | "tel";
  placeholder?: string;
  options?: Option[];
  textarea?: boolean;
  optional?: boolean;
  error?: string;
  register: UseFormRegisterReturn;
  onFieldBlur?: () => void;
  onChange?: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
};

export function FormField({
  id,
  label,
  type = "text",
  inputMode,
  placeholder,
  options,
  textarea,
  optional,
  error,
  register,
  onFieldBlur,
  onChange
}: FormFieldProps) {
  const errorId = `${id}-error`;

  const handleBlur: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> = (
    event
  ) => {
    register.onBlur(event);
    onFieldBlur?.();
  };

  const handleChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> = (
    event
  ) => {
    register.onChange(event);
    onChange?.(event);
  };

  const controlClassName = clsx(
    "mt-2 w-full rounded-md border bg-white px-3 py-2 text-sm text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100",
    error ? "border-rose-400" : "border-zinc-300"
  );

  return (
    <div>
      <label className="flex items-center justify-between text-sm font-medium text-zinc-800" htmlFor={id}>
        <span>{label}</span>
        {optional ? <span className="text-xs font-normal text-zinc-500">Optional</span> : null}
      </label>

      {options ? (
        <select
          {...register}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          className={controlClassName}
          id={id}
          onBlur={handleBlur}
          onChange={handleChange}
        >
          <option value="">Select...</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : textarea ? (
        <textarea
          {...register}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          className={clsx(controlClassName, "min-h-28 resize-y")}
          id={id}
          onBlur={handleBlur}
          onChange={handleChange}
          placeholder={placeholder}
        />
      ) : (
        <input
          {...register}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          className={controlClassName}
          id={id}
          inputMode={inputMode}
          onBlur={handleBlur}
          onChange={handleChange}
          placeholder={placeholder}
          type={type}
        />
      )}

      {error ? (
        <p className="mt-1 text-sm text-rose-700" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
