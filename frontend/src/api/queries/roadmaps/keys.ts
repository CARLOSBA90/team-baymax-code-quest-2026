export const roadmapsKeys = {
  all: ["roadmaps"] as const,
  list: () => [...roadmapsKeys.all, "list"] as const,
};
