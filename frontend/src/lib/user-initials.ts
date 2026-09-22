export function getInitials(name?: string | null, email?: string | null): string {
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (words.length > 0) {
    return words
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  }
  const emailInitial = email?.trim().charAt(0).toUpperCase();
  return emailInitial || "?";
}
