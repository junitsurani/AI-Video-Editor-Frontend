/** Shared Frame mark: the original F geometry in the studio's monochrome palette. */
export function FrameMark({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x=".5"
        y=".5"
        width="31"
        height="31"
        rx="8.5"
        fill="#242424"
        stroke="#626262"
      />
      <path d="M10 9h13M10 9v16m0-9h10" stroke="#f4f4f1" strokeWidth="3" />
    </svg>
  );
}
