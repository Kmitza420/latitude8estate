interface FieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  /** Render a textarea instead of an input. */
  rows?: number;
}

const controlClass =
  "font-body-md w-full rounded-md border border-outline-variant bg-surface px-4 py-3 text-on-surface transition-colors focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none";

/** Labelled form control, shared by every form on the site. */
export default function Field({
  id,
  label,
  type = "text",
  placeholder,
  required,
  rows,
}: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="font-label-md text-label-md mb-1 block tracking-wider text-on-surface-variant uppercase"
      >
        {label}
      </label>
      {rows ? (
        <textarea
          id={id}
          name={id}
          rows={rows}
          placeholder={placeholder}
          required={required}
          className={controlClass}
        />
      ) : (
        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          required={required}
          className={controlClass}
        />
      )}
    </div>
  );
}
