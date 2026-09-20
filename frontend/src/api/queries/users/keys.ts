export const usersKeys = {
  all: ["users"] as const,
  me: () => [...usersKeys.all, "me"] as const,
};
