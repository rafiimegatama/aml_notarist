import { ReactNode } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { useOcrFieldState } from "@/components/forms/OcrFieldContext";
import type { LucideIcon } from "lucide-react";

type Registration = UseFormRegisterReturn;

// FR-3 (Must) — three-state styling: kosong (default), Suggested-belum
// diverifikasi (dashed amber/merah + tag "OCR"), Confirmed (normal, begitu
// notaris fokus ke field itu). LOW_CONFIDENCE_THRESHOLD murni ambang UX,
// bukan dari regulasi — confidence Tesseract di bawah ini ditampilkan lebih
// mencolok (merah, bukan amber).
const LOW_CONFIDENCE_THRESHOLD = 70;

const DEFAULT_BORDER_CLASS = "border border-slate-300";

function ocrBorderClass(ocr: ReturnType<typeof useOcrFieldState>): string {
  if (!ocr || ocr.state === "confirmed") return DEFAULT_BORDER_CLASS;
  const lowConfidence =
    ocr.confidence !== null && ocr.confidence < LOW_CONFIDENCE_THRESHOLD;
  return lowConfidence
    ? "border-2 border-dashed border-red-400 bg-red-50/40"
    : "border-2 border-dashed border-amber-400 bg-amber-50/40";
}

function OcrBadge({ ocr }: { ocr: ReturnType<typeof useOcrFieldState> }) {
  if (!ocr || ocr.state !== "suggested") return null;
  const lowConfidence =
    ocr.confidence !== null && ocr.confidence < LOW_CONFIDENCE_THRESHOLD;
  return (
    <span
      className={
        "ml-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide " +
        (lowConfidence
          ? "bg-red-100 text-red-700"
          : "bg-amber-100 text-amber-700")
      }
      title="Diisi otomatis dari OCR — belum diverifikasi. Klik/isi field ini untuk menandai sudah diperiksa."
    >
      OCR
    </span>
  );
}

function ErrorText({ id, error }: { id: string; error?: FieldError }) {
  if (!error) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm font-medium text-red-600">
      {error.message}
    </p>
  );
}

function Wrapper({
  htmlFor,
  label,
  required,
  error,
  hint,
  badge,
  children,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
  error?: FieldError;
  hint?: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-semibold text-slate-700"
      >
        {label}
        {required && (
          <span className="text-red-600" aria-hidden="true">
            {" "}
            *
          </span>
        )}
        {badge}
      </label>
      {hint && (
        <p id={`${htmlFor}-hint`} className="mt-0.5 text-xs text-muted">
          {hint}
        </p>
      )}
      <div className="mt-1.5">{children}</div>
      <ErrorText id={`${htmlFor}-error`} error={error} />
    </div>
  );
}

// "border" & warna border sengaja dipisah dari sini — ocrBorderClass()
// mengganti keduanya sekaligus supaya tidak ada dua utility warna border
// yang bersaing di className yang sama (mis. border-slate-300 vs border-red-400).
const inputClass =
  "block w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-900 shadow-soft-sm transition-colors placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:bg-slate-100 disabled:text-muted";

function describedBy(
  id: string,
  { hint, error }: { hint?: string; error?: FieldError }
): string | undefined {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(
    (v): v is string => v !== null
  );
  return ids.length > 0 ? ids.join(" ") : undefined;
}

export function TextField({
  label,
  required,
  error,
  hint,
  registration,
  type = "text",
  placeholder,
  disabled,
  ocrPath,
}: {
  label: string;
  required?: boolean;
  error?: FieldError;
  hint?: string;
  registration: Registration;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  /** FR-3 — dot-path field ini di FieldGuesses (lib/ocr/extractFields.ts), kalau field ini bisa diisi OCR. */
  ocrPath?: string;
}) {
  const ocr = useOcrFieldState(ocrPath);
  return (
    <Wrapper
      htmlFor={registration.name}
      label={label}
      required={required}
      error={error}
      hint={hint}
      badge={<OcrBadge ocr={ocr} />}
    >
      <input
        id={registration.name}
        type={type}
        className={`${inputClass} ${ocrBorderClass(ocr)}`}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={describedBy(registration.name, { hint, error })}
        {...registration}
        onFocus={ocr?.onFocus}
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
  ocrPath,
}: {
  label: string;
  required?: boolean;
  error?: FieldError;
  hint?: string;
  registration: Registration;
  rows?: number;
  /** FR-3 — dot-path field ini di FieldGuesses (lib/ocr/extractFields.ts), kalau field ini bisa diisi OCR. */
  ocrPath?: string;
}) {
  const ocr = useOcrFieldState(ocrPath);
  return (
    <Wrapper
      htmlFor={registration.name}
      label={label}
      required={required}
      error={error}
      hint={hint}
      badge={<OcrBadge ocr={ocr} />}
    >
      <textarea
        id={registration.name}
        rows={rows}
        className={`${inputClass} ${ocrBorderClass(ocr)}`}
        aria-invalid={!!error}
        aria-describedby={describedBy(registration.name, { hint, error })}
        {...registration}
        onFocus={ocr?.onFocus}
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
        className={`${inputClass} ${DEFAULT_BORDER_CLASS}`}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={describedBy(registration.name, { hint, error })}
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
  const errorId = `${registration.name}-error`;
  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className="block text-sm font-semibold text-slate-700">
        {label}
        {required && (
          <span className="text-red-600" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </legend>
      <div className="mt-2 flex gap-5">
        {options.map((opt) => {
          const id = `${registration.name}-${opt.value}`;
          return (
            <label key={id} htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                id={id}
                type="radio"
                value={opt.value}
                className="h-4 w-4 accent-brand"
                {...registration}
              />
              {opt.label}
            </label>
          );
        })}
      </div>
      <ErrorText id={errorId} error={error} />
    </fieldset>
  );
}

export function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="card p-6 sm:p-7">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand-hover">
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
          </span>
        )}
        <div>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">{title}</h2>
          {description && (
            <p className="mt-1 text-sm font-medium text-muted">{description}</p>
          )}
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

export function FullRow({ children }: { children: ReactNode }) {
  return <div className="sm:col-span-2">{children}</div>;
}
