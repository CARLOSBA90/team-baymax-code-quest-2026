export const roadmapsKeys = {
  all: ["roadmaps"] as const,
  list: () => [...roadmapsKeys.all, "list"] as const,
  detail: (id: string) => [...roadmapsKeys.all, "detail", id] as const,
};
