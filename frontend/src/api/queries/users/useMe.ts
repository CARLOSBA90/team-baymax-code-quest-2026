import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/api/services";
import type { User } from "@/types";
import { usersKeys } from "./keys";

export function useMe(): UseQueryResult<User> {
  return useQuery({ queryKey: usersKeys.me(), queryFn: getMe });
}
