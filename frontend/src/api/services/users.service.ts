import { get } from "@/api/client";
import type { User } from "@/types";

// TEMPORAL: servicio mínimo para validar la capa API; revisar en el cambio Better Auth.
export function getMe(): Promise<User> {
  return get<User>("/users/me");
}
