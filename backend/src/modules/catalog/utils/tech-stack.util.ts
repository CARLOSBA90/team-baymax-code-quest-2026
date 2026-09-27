import {
  RIVAL_GROUPS,
  STACK_BY_SLUG_FRAGMENT,
  TechStack,
} from '../constants/tech-stack.constants.js';

/**
 * Resolves the primary TechStack for a course by inspecting its slug.
 *
 * Strategy:
 *  1. Split the slug into hyphen-delimited tokens.
 *  2. For each entry in the slug-fragment table, check whether every
 *     hyphen-delimited token of the fragment appears as a contiguous
 *     sub-sequence of tokens in the slug (order-preserving, exact token
 *     match).  This prevents 'react' from matching inside 'rxjs-reactive'.
 *  3. Default to CROSS_CUTTING when no fragment matches.
 */
export function resolveTechStack(slug: string): TechStack {
  const slugTokens = slug.toLowerCase().split('-');
  for (const [fragment, stack] of STACK_BY_SLUG_FRAGMENT) {
    const fragTokens = fragment.toLowerCase().split('-');
    if (containsTokenSequence(slugTokens, fragTokens)) return stack;
  }
  return TechStack.CROSS_CUTTING;
}

/**
 * Returns true when `haystack` contains `needle` as a contiguous sub-sequence
 * of tokens (exact string match per token, preserving order).
 */
function containsTokenSequence(
  haystack: readonly string[],
  needle: readonly string[],
): boolean {
  if (needle.length === 0) return true;
  for (let i = 0; i <= haystack.length - needle.length; i++) {
    let match = true;
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

/**
 * Returns true when `candidate` is compatible with `primary`.
 *
 * Compatibility rules (in priority order):
 *  1. A stack is always compatible with itself.
 *  2. CROSS_CUTTING, DATABASE_CORE and DEVOPS_CORE are compatible with every
 *     primary stack (they enrich any roadmap without creating incoherence).
 *  3. If `primary` belongs to a rival group, every other member of that group
 *     is incompatible with it.
 *  4. Stacks from different domain groups (e.g. FLUTTER vs VUE) are
 *     compatible because they don't compete for the same skill slots.
 */
export function areStacksCompatible(
  primary: TechStack,
  candidate: TechStack,
): boolean {
  if (candidate === primary) return true;
  if (
    candidate === TechStack.CROSS_CUTTING ||
    candidate === TechStack.DATABASE_CORE ||
    candidate === TechStack.DEVOPS_CORE
  )
    return true;

  for (const group of RIVAL_GROUPS) {
    if (group.has(primary) && group.has(candidate) && candidate !== primary) {
      return false;
    }
  }
  return true;
}
