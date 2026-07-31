import { ReactNode } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

type Registration = UseFormRegisterReturn;

function ErrorText({ error }: { error?: FieldError }) {
  if (!error) return null;
  return <p className="mt-1 text-sm text-red-600">{error.message}</p>;
}

function Wrapper({
  htmlFor,
  label,
  required,
  error,
  hint,
  children,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
  error?: FieldError;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      <div className="mt-1">{children}</div>
      <ErrorText error={error} />
    </div>
  );
}

const inputClass =
  "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500";

export function TextField({
  label,
  required,
  error,
  hint,
  registration,
  type = "text",
  placeholder,
  disabled,
}: {
  label: string;
  required?: boolean;
  error?: FieldError;
  hint?: string;
  registration: Registration;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <Wrapper
      htmlFor={registration.name}
      label={label}
      required={required}
      error={error}
      hint={hint}
    >
      <input
        id={registration.name}
        type={type}
        className={inputClass}
        placeholder={placeholder}
        disabled={disabled}
        {...registration}
      />
    </Wrapper>
  );
}

export function TextAreaField({
  label,
  required,
  error,
  hint,
  registration,
  rows = 3,
}: {
  label: string;
  required?: boolean;
  error?: FieldError;
  hint?: string;
  registration: Registration;
  rows?: number;
}) {
  return (
    <Wrapper
      htmlFor={registration.name}
      label={label}
      required={required}
      error={error}
      hint={hint}
    >
      <textarea
        id={registration.name}
        rows={rows}
        className={inputClass}
        {...registration}
      />
    </Wrapper>
  );
}

export function SelectField({
  label,
  required,
  error,
  hint,
  registration,
  options,
  placeholder = "-- Pilih --",
  disabled,
}: {
  label: string;
  required?: boolean;
  error?: FieldError;
  hint?: string;
  registration: Registration;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <Wrapper
      htmlFor={registration.name}
      label={label}
      required={required}
      error={error}
      hint={hint}
    >
      <select
        id={registration.name}
        className={inputClass}
        disabled={disabled}
        {...registration}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </Wrapper>
  );
}

export function RadioGroupField({
  label,
  required,
  error,
  registration,
  options,
}: {
  label: string;
  required?: boolean;
  error?: FieldError;
  registration: Registration;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <span className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      <div className="mt-1 flex gap-4">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-1.5 text-sm">
            <input type="radio" value={opt.value} {...registration} />
            {opt.label}
          </label>
        ))}
      </div>
      <ErrorText error={error} />
    </div>
  );
}

export function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

export function FullRow({ children }: { children: ReactNode }) {
  return <div className="sm:col-span-2">{children}</div>;
}
