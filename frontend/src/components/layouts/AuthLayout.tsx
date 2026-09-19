import { Outlet } from "react-router-dom";
import { Badge, BrandMark, NebulaBackground } from "@/components/ui";

export function AuthLayout() {
  return (
    <NebulaBackground>
      <div className="mb-6 flex w-full justify-center sm:absolute sm:top-8 sm:left-8 sm:mb-0 sm:w-auto sm:justify-start">
        <BrandMark />
      </div>
      <div className="flex w-full flex-col items-center gap-6 sm:w-113">
        <div className="flex flex-col items-center gap-3 text-center">
          <Badge label="Rutas de aprendizaje" />
          <h1 className="font-display text-2xl font-bold text-text-primary sm:text-4xl">
            Tu ruta empieza aquí
          </h1>
        </div>
        <Outlet />
      </div>
    </NebulaBackground>
  );
}
