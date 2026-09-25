export const assessmentsKeys = {
  all: ["assessments"] as const,
  questions: () => [...assessmentsKeys.all, "questions"] as const,
};
