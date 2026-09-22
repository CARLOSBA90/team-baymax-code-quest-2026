export function getInitials(name?: string | null, email?: string | null): string {
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (words.length > 0) {
    return words
      .slice(0, 2)
      .map((word) => Array.from(word)[0]?.toUpperCase() ?? "")
      .join("");
  }
  const trimmedEmail = email?.trim();
  const emailInitial = trimmedEmail ? Array.from(trimmedEmail)[0]?.toUpperCase() : undefined;
  return emailInitial || "?";
}
