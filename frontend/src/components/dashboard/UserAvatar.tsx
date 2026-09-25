import { getInitials } from "@/lib";

export interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  /** Clases extra (p. ej. tamaño). Por defecto el avatar mide `size-9`. */
  className?: string;
}

/** Círculo decorativo con las iniciales del usuario (nombre o, en su defecto, email). */
export function UserAvatar({ name, email, className = "" }: UserAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-accent-hover to-accent font-display text-sm font-bold text-white ${className}`}
    >
      {getInitials(name, email)}
    </span>
  );
}
