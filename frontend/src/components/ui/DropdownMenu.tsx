import type { KeyboardEvent, ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";

export interface DropdownMenuItem {
  id: string;
  label: string;
  onSelect: () => void;
  tone?: "default" | "danger";
  icon?: ReactNode;
  disabled?: boolean;
}

export interface DropdownMenuProps {
  /** aria-label del botón disparador (p. ej. "Más acciones para Frontend moderno con React"). */
  triggerLabel: string;
  /** Contenido visual del disparador (icono ⋮, avatar con iniciales). */
  trigger: ReactNode;
  items: DropdownMenuItem[];
  /** Borde del disparador al que se alinea el menú. Por defecto "end". */
  align?: "start" | "end";
  triggerClassName?: string;
}

type InitialFocus = "first" | "last";

const ALIGN_CLASSES: Record<NonNullable<DropdownMenuProps["align"]>, string> = {
  start: "left-0",
  end: "right-0",
};

const TONE_CLASSES: Record<NonNullable<DropdownMenuItem["tone"]>, string> = {
  default: "text-text-body",
  danger: "text-danger",
};

function getEnabledItems(items: (HTMLButtonElement | null)[]) {
  return items.filter((item): item is HTMLButtonElement => item !== null && !item.disabled);
}

/**
 * Menú desplegable accesible (patrón WAI-ARIA "menu button"). Se abre con clic, Enter, Espacio
 * o flecha abajo (flecha arriba enfoca el último item); dentro, flechas cíclicas y Home/End.
 * Esc cierra y devuelve el foco al disparador; también se cierra al pulsar fuera o cuando el
 * foco sale del componente, de modo que solo queda un menú abierto a la vez.
 */
export function DropdownMenu({
  triggerLabel,
  trigger,
  items,
  align = "end",
  triggerClassName = "",
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const initialFocusRef = useRef<InitialFocus>("first");
  const triggerId = useId();
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const enabled = getEnabledItems(itemRefs.current);
    const target = initialFocusRef.current === "last" ? enabled.at(-1) : enabled[0];
    (target ?? menuRef.current)?.focus();
  }, [open]);

  // Solo cierra cuando el foco va a otro elemento fuera del componente. Con `relatedTarget`
  // nulo (clic en zona no enfocable, o Safari al pulsar un botón) decide el `pointerdown`.
  // Listener nativo (no `onBlur` en el <div>): el contenedor no es un elemento interactivo.
  useEffect(() => {
    const container = containerRef.current;
    if (!open || !container) return;
    const handleFocusOut = (event: FocusEvent) => {
      const nextFocus = event.relatedTarget;
      if (nextFocus instanceof Node && !container.contains(nextFocus)) setOpen(false);
    };
    container.addEventListener("focusout", handleFocusOut);
    return () => container.removeEventListener("focusout", handleFocusOut);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const openMenu = (initialFocus: InitialFocus) => {
    initialFocusRef.current = initialFocus;
    setOpen(true);
  };

  const closeAndFocusTrigger = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openMenu(event.key === "ArrowUp" ? "last" : "first");
    }
  };

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const enabled = getEnabledItems(itemRefs.current);
    const currentIndex = enabled.indexOf(document.activeElement as HTMLButtonElement);
    let next: HTMLButtonElement | undefined;

    switch (event.key) {
      case "ArrowDown":
        next = enabled[(currentIndex + 1) % enabled.length];
        break;
      case "ArrowUp":
        next = enabled[currentIndex <= 0 ? enabled.length - 1 : currentIndex - 1];
        break;
      case "Home":
        next = enabled[0];
        break;
      case "End":
        next = enabled.at(-1);
        break;
      case "Escape":
        event.preventDefault();
        closeAndFocusTrigger();
        return;
      default:
        return;
    }
    event.preventDefault();
    next?.focus();
  };

  const handleSelect = (item: DropdownMenuItem) => {
    closeAndFocusTrigger();
    item.onSelect();
  };

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? setOpen(false) : openMenu("first"))}
        onKeyDown={handleTriggerKeyDown}
        className={`flex cursor-pointer items-center justify-center rounded-lg outline-none focus-visible:shadow-ring-focus ${triggerClassName}`}
      >
        {trigger}
      </button>
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-labelledby={triggerId}
          tabIndex={-1}
          onKeyDown={handleMenuKeyDown}
          className={`absolute top-full z-30 mt-2 flex min-w-44 flex-col gap-0.5 rounded-control border border-border-card bg-bg-surface-solid p-1 shadow-card outline-none ${ALIGN_CLASSES[align]}`}
        >
          {items.map((item, index) => (
            <button
              key={item.id}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              type="button"
              role="menuitem"
              tabIndex={-1}
              disabled={item.disabled}
              onClick={() => handleSelect(item)}
              className={`flex w-full cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-left font-body text-sm outline-none hover:bg-bg-ghost-hover focus:bg-bg-ghost-hover focus-visible:shadow-ring-focus disabled:cursor-not-allowed disabled:text-text-muted disabled:hover:bg-transparent ${TONE_CLASSES[item.tone ?? "default"]}`}
            >
              {item.icon && (
                <span aria-hidden="true" className="flex size-4 shrink-0 items-center">
                  {item.icon}
                </span>
              )}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
