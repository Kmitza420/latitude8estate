interface IconProps {
  /** Material Symbols ligature name, e.g. "arrow_forward". */
  name: string;
  className?: string;
}

/** React twin of Icon.astro, for use inside hydrated islands. */
export default function Icon({ name, className = "" }: IconProps) {
  return (
    <span className={`material-symbols-outlined ${className}`} aria-hidden="true">
      {name}
    </span>
  );
}
