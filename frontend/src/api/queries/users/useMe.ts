import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { usersKeys } from "@/api/queries/users";
import { getMe } from "@/api/services";
import type { User } from "@/types";

export function useMe(): UseQueryResult<User> {
  return useQuery({ queryKey: usersKeys.me(), queryFn: getMe });
}
