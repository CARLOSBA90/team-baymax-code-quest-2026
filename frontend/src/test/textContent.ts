import type { MatcherFunction } from "@testing-library/react";

/**
 * Matcher para `getByText` que compara el `textContent` completo del elemento (incluidos sus
 * hijos), para textos partidos en varios nodos (p. ej. una parte en un `<span hidden sm:inline>`).
 * El `getByText(string)` por defecto solo mira los nodos de texto propios. Devuelve solo el
 * elemento más interno con ese texto, no sus ancestros.
 */
export function byTextContent(text: string): MatcherFunction {
  return (_content, element) => {
    if (!element || element.textContent !== text) return false;
    return Array.from(element.children).every((child) => child.textContent !== text);
  };
}
