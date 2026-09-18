export function AuthDivider() {
  return (
    <div className="relative my-3">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
      </div>
      <div className="relative flex justify-center text-xs uppercase tracking-wide">
        <span className="bg-white px-3 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
          o continúa con tus datos
        </span>
      </div>
    </div>
  );
}
