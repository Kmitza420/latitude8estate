/**
 * `light` sits on the page's own surface (`/contact-us`, the property
 * sidebar); `dark` sits on a `primary` green panel (the property-management enquiry).
 */
export type FieldTone = "light" | "dark";

interface FieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  /** Render a textarea instead of an input. */
  rows?: number;
  /** Render a select over these values instead of a free-text control. */
  options?: string[];
  tone?: FieldTone;
}

const controlBase = "font-body-md w-full rounded-md border px-4 py-3 transition-colors focus:outline-none";

const controlTone: Record<FieldTone, string> = {
  light:
    "border-outline-variant bg-surface text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary",
  dark: "border-on-primary/20 bg-white/5 text-on-primary placeholder:text-on-primary/40 focus:border-secondary-fixed",
};

/**
 * A select on the dark tone needs an opaque background rather than the
 * translucent `white/5` the text controls use: the option list inherits it,
 * and on most platforms translucent options render as unreadable.
 */
const selectTone: Record<FieldTone, string> = {
  light: controlTone.light,
  dark: "border-on-primary/20 bg-primary-container text-on-primary focus:border-secondary-fixed",
};

const labelTone: Record<FieldTone, string> = {
  light: "text-on-surface-variant",
  dark: "text-secondary-fixed",
};

/** Labelled form control, shared by every form on the site. */
export default function Field({
  id,
  label,
  type = "text",
  placeholder,
  required,
  rows,
  options,
  tone = "light",
}: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className={`font-label-md text-label-md mb-1 block tracking-wider uppercase ${labelTone[tone]}`}
      >
        {label}
      </label>

      {options ? (
        <select
          id={id}
          name={id}
          required={required}
          defaultValue={options[0]}
          className={`${controlBase} ${selectTone[tone]}`}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : rows ? (
        <textarea
          id={id}
          name={id}
          rows={rows}
          placeholder={placeholder}
          required={required}
          className={`${controlBase} ${controlTone[tone]} ${
            // The dark panel's textarea is fixed-height by design; the light
            // one has always been resizable, so leave that affordance alone.
            tone === "dark" ? "resize-none" : ""
          }`}
        />
      ) : (
        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          required={required}
          className={`${controlBase} ${controlTone[tone]}`}
        />
      )}
    </div>
  );
}
