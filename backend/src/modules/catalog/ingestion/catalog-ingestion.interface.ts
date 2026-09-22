/** Curso tal como llega de la fuente, sin validar ni normalizar. */
export interface RawCourse {
  row: number; // Fila de origen, para reportar errores
  slug: string;
  title: string;
  url: string;
  description: string;
  level: string;
  tags: string;
  durationHours: string;
  imageUrl: string;
}

/** Fuente de cursos del catálogo: CSV hoy, scraper u otra en el futuro. */
export interface CatalogIngestionAdapter {
  fetchCourses(): Promise<RawCourse[]>;
}
