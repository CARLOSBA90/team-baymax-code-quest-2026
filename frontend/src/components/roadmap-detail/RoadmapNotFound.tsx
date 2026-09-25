import { Link } from "react-router-dom";
import { NebulaSurface } from "@/components/ui";
import { PRIMARY_LINK_CLASSES } from "./link-classes";

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
      <Link to="/dashboard/roadmaps" className={`${PRIMARY_LINK_CLASSES} mt-8 h-12 px-6`}>
        Volver a Mis Rutas
      </Link>
    </NebulaSurface>
  );
}
