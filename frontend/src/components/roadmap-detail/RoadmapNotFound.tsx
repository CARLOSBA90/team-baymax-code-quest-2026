import { Link } from "react-router-dom";
import { NebulaSurface } from "@/components/ui";

/** Estado 404 del detalle: la ruta no existe, el id no es válido o es de otro usuario. */
export function RoadmapNotFound() {
  return (
    <NebulaSurface>
      <div className="flex max-w-md flex-col gap-5 text-center">
        <h1 className="font-display text-2xl font-bold text-text-primary">
          No encontramos esta ruta
        </h1>
        <p className="text-text-secondary">
          Puede que se haya eliminado o que el enlace no sea correcto.
        </p>
      </div>
      <Link
        to="/dashboard/roadmaps"
        className="mt-8 flex h-12 w-fit items-center justify-center rounded-xl border border-transparent bg-accent px-6 font-body font-bold text-white shadow-primary outline-none transition-[filter,box-shadow,border-color] duration-150 ease-out hover:brightness-110 focus-visible:border-accent-hover focus-visible:shadow-ring-focus"
      >
        Volver a Mis Rutas
      </Link>
    </NebulaSurface>
  );
}
