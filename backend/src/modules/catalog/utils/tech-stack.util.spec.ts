import { describe, expect, it } from 'vitest';
import { TechStack } from '../constants/tech-stack.constants.js';
import { areStacksCompatible, resolveTechStack } from './tech-stack.util.js';

describe('resolveTechStack', () => {
  it('identifies Vue ecosystem by slug fragment', () => {
    expect(resolveTechStack('vue-cero-a-experto')).toBe(TechStack.VUE);
    expect(resolveTechStack('nuxt-profesional')).toBe(TechStack.VUE);
    expect(resolveTechStack('pinia-state-management')).toBe(TechStack.VUE);
  });

  it('identifies React ecosystem by slug fragment', () => {
    expect(resolveTechStack('react-cero-experto')).toBe(TechStack.REACT);
    expect(resolveTechStack('nextjs-full-stack')).toBe(TechStack.REACT);
  });

  it('identifies Node / NestJS ecosystem by slug fragment', () => {
    expect(resolveTechStack('nestjs-microservicios')).toBe(TechStack.NODE);
    // base NestJS course has slug 'nest'
    expect(resolveTechStack('nest')).toBe(TechStack.NODE);
    expect(resolveTechStack('nest-graphql')).toBe(TechStack.NODE);
  });

  it('identifies .NET ecosystem by slug fragment', () => {
    expect(resolveTechStack('dotnet-avanzado')).toBe(TechStack.DOTNET);
    expect(resolveTechStack('net-backend')).toBe(TechStack.DOTNET);
    expect(resolveTechStack('net-pruebascompletas')).toBe(TechStack.DOTNET);
    expect(resolveTechStack('netfullstack')).toBe(TechStack.DOTNET);
  });

  it('identifies Angular ecosystem by slug fragment', () => {
    expect(resolveTechStack('angular-avanzado')).toBe(TechStack.ANGULAR);
    expect(resolveTechStack('rxjs-reactive')).toBe(TechStack.ANGULAR);
  });

  it('identifies Astro by slug fragment', () => {
    expect(resolveTechStack('astro-rapido')).toBe(TechStack.ASTRO);
  });

  it('identifies Python ecosystem by slug fragment', () => {
    expect(resolveTechStack('python-fundamentos')).toBe(TechStack.PYTHON);
    expect(resolveTechStack('fastapi-microservices')).toBe(TechStack.PYTHON);
    expect(resolveTechStack('django-avanzado')).toBe(TechStack.PYTHON);
  });

  it('identifies Java ecosystem by slug fragment', () => {
    expect(resolveTechStack('java-poo')).toBe(TechStack.JAVA);
    expect(resolveTechStack('spring-boot-microservicios')).toBe(TechStack.JAVA);
    expect(resolveTechStack('kafka-springboot-event-driven')).toBe(
      TechStack.JAVA,
    );
    // springboot without hyphen (e.g. 'springboot-mvc-hexagonal')
    expect(resolveTechStack('springboot-mvc-hexagonal')).toBe(TechStack.JAVA);
  });

  it('identifies Go ecosystem by slug fragment', () => {
    expect(resolveTechStack('golang-fundamentos-lenguaje')).toBe(TechStack.GO);
    expect(resolveTechStack('go-backend-profesional')).toBe(TechStack.GO);
    expect(resolveTechStack('go-microservicios')).toBe(TechStack.GO);
  });

  it('identifies Flutter / Dart ecosystem by slug fragment', () => {
    expect(resolveTechStack('flutter-movil-cero-a-experto')).toBe(
      TechStack.FLUTTER,
    );
    expect(resolveTechStack('dart-cero-hasta-detalles')).toBe(TechStack.FLUTTER);
    expect(resolveTechStack('flutter-bloc-provider')).toBe(TechStack.FLUTTER);
    expect(resolveTechStack('riverpod-con-anotaciones')).toBe(TechStack.FLUTTER);
  });

  it('identifies cross-cutting tools by slug fragment', () => {
    expect(resolveTechStack('typescript-jose-herrera')).toBe(
      TechStack.CROSS_CUTTING,
    );
    expect(resolveTechStack('git-github-profesional')).toBe(
      TechStack.CROSS_CUTTING,
    );
    expect(resolveTechStack('tailwindcss-desde-cero')).toBe(
      TechStack.CROSS_CUTTING,
    );
  });

  it('defaults to CROSS_CUTTING for unknown slugs', () => {
    expect(resolveTechStack('some-unknown-course')).toBe(
      TechStack.CROSS_CUTTING,
    );
  });
});

describe('areStacksCompatible', () => {
  it('a stack is compatible with itself', () => {
    expect(areStacksCompatible(TechStack.VUE, TechStack.VUE)).toBe(true);
    expect(areStacksCompatible(TechStack.PYTHON, TechStack.PYTHON)).toBe(true);
  });

  it('CROSS_CUTTING is compatible with any primary stack', () => {
    expect(areStacksCompatible(TechStack.VUE, TechStack.CROSS_CUTTING)).toBe(
      true,
    );
    expect(
      areStacksCompatible(TechStack.PYTHON, TechStack.CROSS_CUTTING),
    ).toBe(true);
    expect(
      areStacksCompatible(TechStack.FLUTTER, TechStack.CROSS_CUTTING),
    ).toBe(true);
  });

  it('DATABASE_CORE is compatible with any primary stack', () => {
    expect(areStacksCompatible(TechStack.NODE, TechStack.DATABASE_CORE)).toBe(
      true,
    );
    expect(areStacksCompatible(TechStack.GO, TechStack.DATABASE_CORE)).toBe(
      true,
    );
  });

  it('DEVOPS_CORE is compatible with any primary stack', () => {
    expect(areStacksCompatible(TechStack.VUE, TechStack.DEVOPS_CORE)).toBe(
      true,
    );
    expect(areStacksCompatible(TechStack.JAVA, TechStack.DEVOPS_CORE)).toBe(
      true,
    );
  });

  // ── Frontend rivals ────────────────────────────────────────────────────────
  it('VUE is incompatible with frontend rivals', () => {
    expect(areStacksCompatible(TechStack.VUE, TechStack.REACT)).toBe(false);
    expect(areStacksCompatible(TechStack.VUE, TechStack.ANGULAR)).toBe(false);
    expect(areStacksCompatible(TechStack.VUE, TechStack.ASTRO)).toBe(false);
    expect(areStacksCompatible(TechStack.VUE, TechStack.QWIK)).toBe(false);
  });

  it('REACT is incompatible with frontend rivals', () => {
    expect(areStacksCompatible(TechStack.REACT, TechStack.VUE)).toBe(false);
    expect(areStacksCompatible(TechStack.REACT, TechStack.ANGULAR)).toBe(false);
    expect(areStacksCompatible(TechStack.REACT, TechStack.ASTRO)).toBe(false);
  });

  // ── Backend rivals ─────────────────────────────────────────────────────────
  it('PYTHON is incompatible with backend rivals', () => {
    expect(areStacksCompatible(TechStack.PYTHON, TechStack.JAVA)).toBe(false);
    expect(areStacksCompatible(TechStack.PYTHON, TechStack.GO)).toBe(false);
    expect(areStacksCompatible(TechStack.PYTHON, TechStack.PHP)).toBe(false);
    expect(areStacksCompatible(TechStack.PYTHON, TechStack.DOTNET)).toBe(false);
    expect(areStacksCompatible(TechStack.PYTHON, TechStack.NODE)).toBe(false);
  });

  it('JAVA is incompatible with backend rivals', () => {
    expect(areStacksCompatible(TechStack.JAVA, TechStack.PYTHON)).toBe(false);
    expect(areStacksCompatible(TechStack.JAVA, TechStack.GO)).toBe(false);
    expect(areStacksCompatible(TechStack.JAVA, TechStack.PHP)).toBe(false);
  });

  // ── Mobile rivals ──────────────────────────────────────────────────────────
  it('FLUTTER is incompatible with REACT_NATIVE', () => {
    expect(areStacksCompatible(TechStack.FLUTTER, TechStack.REACT_NATIVE)).toBe(
      false,
    );
  });

  it('REACT_NATIVE is incompatible with FLUTTER', () => {
    expect(areStacksCompatible(TechStack.REACT_NATIVE, TechStack.FLUTTER)).toBe(
      false,
    );
  });

  // ── Cross-domain stacks are compatible ────────────────────────────────────
  it('FLUTTER is compatible with VUE (different domain)', () => {
    expect(areStacksCompatible(TechStack.FLUTTER, TechStack.VUE)).toBe(true);
  });

  it('VUE is compatible with FLUTTER (different domain)', () => {
    expect(areStacksCompatible(TechStack.VUE, TechStack.FLUTTER)).toBe(true);
  });

  it('PYTHON is compatible with VUE (different domain)', () => {
    expect(areStacksCompatible(TechStack.PYTHON, TechStack.VUE)).toBe(true);
  });
});
