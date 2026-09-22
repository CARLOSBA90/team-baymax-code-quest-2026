/**
 * scrape-devtalles.ts
 * Extrae UNA SOLA VEZ el catalogo de cursos y las rutas oficiales de DevTalles
 * y genera seed/cursos.json y seed/rutas.json para cargar en la base de datos,
 * más prisma/seed/courses.csv, el mismo archivo que importa pnpm db:seed.
 *
 * Uso:
 *   npm i -D cheerio tsx
 *   npx tsx scripts/scrape-devtalles.ts            # descarga y genera los JSON
 *   npx tsx scripts/scrape-devtalles.ts --local archivo.htm   # prueba el parser con un HTML guardado
 *
 * Las paginas se cachean en .cache/ para no volver a pedirlas al sitio.
 * Selectores verificados sobre cursos.devtalles.com/courses/spring-AI (sep-2026).
 */

import * as cheerio from "cheerio";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "https://cursos.devtalles.com";
// Misma ruta que lee prisma/seed.ts, sin depender del directorio de ejecución.
const CSV_SEED_PATH = fileURLToPath(new URL("../prisma/seed/courses.csv", import.meta.url));
const PAUSA_MS = 1000;

// Paginas de listado a recorrer (pestañas de "Todos los cursos")
const LISTADOS = [
  "/pages/todos-los-cursos",
  "/pages/todos-los-cursos-gratuitos",
  "/pages/todos-los-cursos-minicursos",
  "/pages/todos-los-cursos-exclusivos",
  // "/pages/todos-los-cursos-legacy",   // descomentar si quieren incluir cursos legacy
];

// Rutas oficiales de DevTalles (menu "Rutas" > programas-fundamentos)
const RUTAS_OFICIALES: Record<string, string> = {
  fundamentos: "/pages/programas-fundamentos",
  react: "/pages/programas-react",
  vue: "/pages/programas-vue",
  angular: "/pages/programas-angular",
  node: "/pages/programas-node",
  nest: "/pages/programas-nest",
  "dart-movil": "/pages/ruta-dart",
  python: "/pages/ruta-python",
  java: "/pages/ruta-java",
  csharp: "/pages/ruta-c",
  ia: "/pages/ruta-ia",
  php: "/pages/ruta-php",
  go: "/pages/ruta-go",
};

const ETIQUETAS_RUTA = ["REQUERIDO", "RECOMENDADO", "OPCIONAL PERO MUY ÚTIL", "EN CUALQUIER MOMENTO"] as const;
type TipoRuta = (typeof ETIQUETAS_RUTA)[number];

// ----------------------------------------------------------------------------
// Tipos de salida
// ----------------------------------------------------------------------------

export interface Leccion {
  titulo: string;
  tipo: "VIDEO" | "TEXTO" | "OTRO";
}

export interface Seccion {
  titulo: string;
  lecciones: Leccion[];
}

export interface Curso {
  slug: string;
  urlCurso: string;
  titulo: string;
  descripcion: string;
  descripcionLarga: string;
  imagenUrl: string | null;
  tecnologias: string[];
  requisitos: string[];
  cantidadLecciones: number | null;
  duracionHoras: number | null;
  instructor: string | null;
  precioUsd: number | null;
  esGratuito: boolean;
  nivel: "PRINCIPIANTE" | "INTERMEDIO" | "AVANZADO";
  rutaOficial: string | null;
  temario: Seccion[];
}

export interface RutaOficial {
  codigo: string;
  url: string;
  cursos: { slug: string; tipo: TipoRuta; orden: number }[];
}

// ----------------------------------------------------------------------------
// Utilidades
// ----------------------------------------------------------------------------

const limpiar = (s: string) => s.replace(/\s+/g, " ").trim();
const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

function slugDeUrl(url: string): string {
  const m = url.match(/\/courses\/([^/?#]+)/);
  return m ? decodeURIComponent(m[1]) : url;
}

async function existe(p: string) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function obtenerHtml(ruta: string): Promise<string> {
  const url = ruta.startsWith("http") ? ruta : BASE + ruta;
  const nombre = createHash("md5").update(url).digest("hex") + ".html";
  const cachePath = path.join(".cache", nombre);
  if (await existe(cachePath)) return readFile(cachePath, "utf8");

  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (CodeQuest-2026 seed builder; contacto en README)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} al pedir ${url}`);
  const html = await res.text();
  await mkdir(".cache", { recursive: true });
  await writeFile(cachePath, html, "utf8");
  await dormir(PAUSA_MS);
  return html;
}

// ----------------------------------------------------------------------------
// Salida CSV (formato de spec-kits/system-design/03-catalogo-cursos.md)
//   slug,title,url,description,level,tags,durationHours,imageUrl
// ----------------------------------------------------------------------------

/** Tags que conserva el CSV; el importador los normaliza a skills internas. */
const TAGS_PERMITIDOS = new Set([
  "javascript", "typescript", "html", "css", "tailwind", "git", "github",
  "react", "nextjs", "vue", "nuxt", "angular", "svelte", "astro",
  "node", "nodejs", "express", "nestjs", "nest", "graphql", "rest",
  "python", "django", "fastapi", "java", "spring", "csharp", "dotnet", "php", "laravel", "go",
  "sql", "postgresql", "postgres", "mysql", "mongodb", "prisma", "redis", "typeorm",
  "docker", "kubernetes", "ci-cd", "aws", "linux", "nginx",
  "flutter", "dart", "react-native", "expo", "android", "ios",
  "testing", "jest", "vitest", "cypress",
  "ia", "ai", "openai", "langchain", "rag", "llm",
]);

const NIVEL_A_LEVEL: Record<Curso["nivel"], string> = {
  PRINCIPIANTE: "beginner",
  INTERMEDIO: "intermediate",
  AVANZADO: "advanced",
};

const csvCampo = (v: string | number | null | undefined) => {
  const t = v == null ? "" : String(v).replace(/\s+/g, " ").trim();
  return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

/** Normaliza una keyword del sitio a un tag corto y la filtra por la lista blanca. */
export function tagsDeCurso(curso: Curso): string[] {
  const vistos = new Set<string>();
  for (const k of curso.tecnologias) {
    const tag = k.toLowerCase().replace(/\./g, "").replace(/\s+/g, "-").replace(/^node-?js$/, "node");
    if (TAGS_PERMITIDOS.has(tag)) vistos.add(tag);
  }
  return [...vistos];
}

export function cursoACsv(curso: Curso): string {
  return [
    curso.slug,
    curso.titulo,
    curso.urlCurso,
    curso.descripcion,
    NIVEL_A_LEVEL[curso.nivel],
    tagsDeCurso(curso).join(","),
    curso.duracionHoras == null ? "" : Math.max(1, Math.round(curso.duracionHoras)),
    curso.imagenUrl ?? "",
  ].map(csvCampo).join(",");
}

export const CSV_CABECERA = "slug,title,url,description,level,tags,durationHours,imageUrl";

// ----------------------------------------------------------------------------
// Parsers (funciones puras: reciben HTML, devuelven datos)
// ----------------------------------------------------------------------------

/** Listado: todos los enlaces a /courses/<slug>, sin duplicados */
export function parseListado(html: string): string[] {
  const $ = cheerio.load(html);
  const urls = new Set<string>();
  $('a[href*="/courses/"]').each((_, a) => {
    const href = $(a).attr("href") ?? "";
    const m = href.match(/\/courses\/[^/?#]+/);
    if (m) urls.add(BASE + m[0]);
  });
  return [...urls];
}

/** Inferencia de nivel a partir de titulo, descripcion y requisitos previos */
function inferirNivel(titulo: string, descripcion: string, requisitos: string[]): Curso["nivel"] {
  const texto = `${titulo} ${descripcion}`.toLowerCase();
  const req = requisitos.join(" ").toLowerCase();

  if (/\b(pro|avanzad|microservicio|arquitectura|patrones|hexagonal|event-driven)\b/.test(texto)) return "AVANZADO";
  if (/(principiante|de cero|desde cero|primeros pasos|fundamentos|empieza tu camino|hasta los detalles)/.test(texto)) return "PRINCIPIANTE";
  if (requisitos.length === 0 || /no (es )?necesari|sin conocimientos/.test(req)) return "PRINCIPIANTE";
  return "INTERMEDIO";
}

/** Pagina publica de un curso (body.course-landing-page) */
export function parseCurso(html: string, url: string): Curso {
  const $ = cheerio.load(html);

  // El h2 trae un <style> y el subtítulo (CURSO GRATUITO, Mini-curso);
  // se quitan ambos antes de leer el texto.
  const titulo = limpiar(
    $("section.banner--course h2.section__heading")
      .first()
      .clone()
      .find("style, .devtalles-course-subtitle")
      .remove()
      .end()
      .text(),
  );
  const descripcion = limpiar($("section.banner--course p.section__subheading").first().text());
  const imagenUrl = $('meta[property="og:image"]').attr("content") ?? null;
  const tecnologias = ($('meta[name="keywords"]').attr("content") ?? "")
    .split(",")
    .map(limpiar)
    .filter(Boolean);

  // Ficha "Acerca de este curso"
  let cantidadLecciones: number | null = null;
  let duracionHoras: number | null = null;
  let instructor: string | null = null;
  let precioUsd: number | null = null;
  let esGratuito = false;

  $("section.course-curriculum-card__details li.course-curriculum-card__details-item span").each((_, el) => {
    const t = limpiar($(el).text());
    if (!t) return;
    let m: RegExpMatchArray | null;
    if ((m = t.match(/^\$\s*([\d.,]+)/))) precioUsd = parseFloat(m[1].replace(",", ""));
    else if (/gratis|free/i.test(t)) esGratuito = true;
    else if ((m = t.match(/(\d+)\s+lecciones/i))) cantidadLecciones = parseInt(m[1], 10);
    else if ((m = t.match(/([\d.,]+)\s+horas/i))) duracionHoras = parseFloat(m[1].replace(",", "."));
    else instructor = t;
  });
  if (precioUsd === 0) esGratuito = true;

  // Columnas "Requisitos previos" / "Descripcion del curso"
  let requisitos: string[] = [];
  let descripcionLarga = "";
  $(".spec-column-clean").each((_, col) => {
    const cabecera = limpiar($(col).find(".spec-column-title").first().text());
    const cuerpo = $(col).clone();
    cuerpo.find(".spec-column-title").remove();
    if (/requisitos/i.test(cabecera)) {
      requisitos = cuerpo
        .text()
        .split(/\n|•/)
        .map(limpiar)
        .filter((l) => l.length > 3);
    } else if (/descripci/i.test(cabecera)) {
      descripcionLarga = limpiar(cuerpo.text());
    }
  });

  // Temario
  const temario: Seccion[] = [];
  $("li.course-curriculum__chapter").each((_, cap) => {
    const tituloSeccion = limpiar($(cap).find("h3.course-curriculum__chapter-title").first().text());
    const lecciones: Leccion[] = [];
    $(cap)
      .find("ol.course-curriculum__chapter-content > li")
      .each((_, li) => {
        const t = limpiar($(li).find(".course-curriculum__lesson-title").text());
        if (!t) return;
        const icono = $(li).find("i.toga-icon").attr("class") ?? "";
        const tipo: Leccion["tipo"] = /content-video/.test(icono) ? "VIDEO" : /content-text/.test(icono) ? "TEXTO" : "OTRO";
        lecciones.push({ titulo: t, tipo });
      });
    temario.push({ titulo: tituloSeccion, lecciones });
  });

  // Enlace a la ruta oficial ("Ver ruta")
  const rutaHref = $("a")
    .filter((_, a) => /ver ruta/i.test($(a).text()))
    .first()
    .attr("href");
  const rutaOficial = rutaHref ? (rutaHref.startsWith("http") ? rutaHref : BASE + rutaHref) : null;

  return {
    slug: slugDeUrl(url),
    urlCurso: url,
    titulo,
    descripcion,
    descripcionLarga,
    imagenUrl,
    tecnologias,
    requisitos,
    cantidadLecciones,
    duracionHoras,
    instructor,
    precioUsd,
    esGratuito,
    nivel: inferirNivel(titulo, descripcion, requisitos),
    rutaOficial,
    temario,
  };
}

/**
 * Pagina de ruta oficial. Recorre el DOM en orden: cada vez que aparece una
 * etiqueta (REQUERIDO, RECOMENDADO, ...) la aplica a los siguientes enlaces a cursos.
 * NOTA: verificado sobre el texto renderizado, no sobre el HTML; revisar la
 * primera ejecucion.
 */
export function parseRuta(html: string, codigo: string, url: string): RutaOficial {
  const $ = cheerio.load(html);
  const cursos: RutaOficial["cursos"] = [];
  let tipoActual: TipoRuta = "REQUERIDO";
  let orden = 0;
  const vistos = new Set<string>();

  $("main *").each((_, el) => {
    if (el.type !== "tag") return;
    const texto = limpiar($(el).clone().children().remove().end().text()).toUpperCase();
    const etiqueta = ETIQUETAS_RUTA.find((e) => texto === e);
    if (etiqueta) {
      tipoActual = etiqueta;
      return;
    }
    if (el.name === "a") {
      const href = $(el).attr("href") ?? "";
      if (!href.includes("/courses/")) return;
      const slug = slugDeUrl(href);
      if (vistos.has(slug)) return;
      vistos.add(slug);
      cursos.push({ slug, tipo: tipoActual, orden: ++orden });
    }
  });

  return { codigo, url, cursos };
}

// ----------------------------------------------------------------------------
// Programa principal
// ----------------------------------------------------------------------------

async function main() {
  console.log("scrape-devtalles: iniciando");
  const args = process.argv.slice(2);

  // Modo prueba: parsear un archivo HTML local de un curso
  const idxLocal = args.indexOf("--local");
  if (idxLocal >= 0) {
    const archivo = args[idxLocal + 1];
    const html = await readFile(archivo, "utf8");
    const url = cheerio.load(html)('meta[property="og:url"]').attr("content") ?? "local";
    const curso = parseCurso(html, url);
    console.log(JSON.stringify(curso, null, 2));
    console.log("\nCSV:\n" + CSV_CABECERA + "\n" + cursoACsv(curso));
    return;
  }

  await mkdir("seed", { recursive: true });

  // 1) Listado de cursos
  const urls = new Set<string>();
  for (const listado of LISTADOS) {
    console.log(`Listado ${listado}`);
    for (const u of parseListado(await obtenerHtml(listado))) urls.add(u);
  }
  console.log(`${urls.size} cursos encontrados`);

  // 2) Cada curso
  const cursos: Curso[] = [];
  for (const url of urls) {
    try {
      const curso = parseCurso(await obtenerHtml(url), url);
      cursos.push(curso);
      console.log(`  ok  ${curso.slug}  (${curso.cantidadLecciones ?? "?"} lecciones, ${curso.nivel})`);
    } catch (e) {
      console.warn(`  ERR ${url}: ${(e as Error).message}`);
    }
  }
  cursos.sort((a, b) => a.titulo.localeCompare(b.titulo, "es"));
  await writeFile("seed/cursos.json", JSON.stringify(cursos, null, 2), "utf8");
  await mkdir(path.dirname(CSV_SEED_PATH), { recursive: true });
  await writeFile(CSV_SEED_PATH, [CSV_CABECERA, ...cursos.map(cursoACsv)].join("\n") + "\n", "utf8");

  // 3) Rutas oficiales
  const rutas: RutaOficial[] = [];
  for (const [codigo, ruta] of Object.entries(RUTAS_OFICIALES)) {
    try {
      const r = parseRuta(await obtenerHtml(ruta), codigo, BASE + ruta);
      rutas.push(r);
      console.log(`  ruta ${codigo}: ${r.cursos.length} cursos`);
    } catch (e) {
      console.warn(`  ERR ruta ${codigo}: ${(e as Error).message}`);
    }
  }
  await writeFile("seed/rutas.json", JSON.stringify(rutas, null, 2), "utf8");

  console.log("\nListo: prisma/seed/courses.csv, seed/cursos.json y seed/rutas.json");
  console.log("Siguiente paso: revisar a mano el campo nivel y el tipo de cada curso en las rutas.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});