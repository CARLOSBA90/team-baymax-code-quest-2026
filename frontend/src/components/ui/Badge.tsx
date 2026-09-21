type BadgeProps = {
  label: string;
};

export function Badge({ label }: BadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-body font-semibold text-xs uppercase text-accent-soft"
      style={{
        borderColor: "rgba(167, 139, 250, 0.28)",
        backgroundColor: "rgba(139, 92, 246, 0.10)",
      }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" aria-hidden="true" />
      {label}
    </span>
  );
}
