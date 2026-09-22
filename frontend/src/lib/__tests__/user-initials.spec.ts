import { describe, expect, it } from "vitest";
import { getInitials } from "@/lib";

describe("getInitials", () => {
  it("devuelve las iniciales de dos palabras", () => {
    expect(getInitials("Ada Lovelace")).toBe("AL");
  });

  it("devuelve una sola inicial con un nombre de una palabra", () => {
    expect(getInitials("Ada")).toBe("A");
  });

  it("ignora espacios múltiples y de los extremos", () => {
    expect(getInitials("  Ada    Lovelace  ")).toBe("AL");
  });

  it("pasa a mayúsculas", () => {
    expect(getInitials("ada lovelace")).toBe("AL");
  });

  it("usa solo las dos primeras palabras", () => {
    expect(getInitials("Ada Augusta King Lovelace")).toBe("AA");
  });

  it("usa la inicial del email si no hay nombre", () => {
    expect(getInitials(undefined, "ada@example.com")).toBe("A");
    expect(getInitials(null, "zed@example.com")).toBe("Z");
  });

  it("usa la inicial del email si el nombre está vacío", () => {
    expect(getInitials("", "ada@example.com")).toBe("A");
    expect(getInitials("   ", "ada@example.com")).toBe("A");
  });

  it('devuelve "?" si no hay datos', () => {
    expect(getInitials()).toBe("?");
    expect(getInitials(null, null)).toBe("?");
    expect(getInitials("", "")).toBe("?");
  });
});
