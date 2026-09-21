export function AuthDivider() {
  return (
    <div className="flex items-center gap-3.5">
      <span
        aria-hidden="true"
        className="h-px flex-1"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12))" }}
      />
      <span className="whitespace-nowrap font-body text-xs font-semibold uppercase text-text-muted tracking-widest">
        O con tu email
      </span>
      <span
        aria-hidden="true"
        className="h-px flex-1"
        style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.12), transparent)" }}
      />
    </div>
  );
}
