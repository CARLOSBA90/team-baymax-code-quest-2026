type BrandMarkProps = {
  as?: "link" | "span";
  href?: string;
};

export function BrandMark({ as = "span", href = "/" }: BrandMarkProps) {
  const content = (
    <>
      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="8 6 2 12 8 18" />
          <polyline points="16 6 22 12 16 18" />
        </svg>
      </span>
      <span className="font-display leading-none tracking-tight">
        <span className="font-bold text-text-primary">devtalles </span>
        <span className="font-medium text-text-muted">paths</span>
      </span>
    </>
  );

  if (as === "link") {
    return (
      <a href={href} className="flex items-center gap-2 no-underline">
        {content}
      </a>
    );
  }

  return <span className="flex items-center gap-2">{content}</span>;
}
