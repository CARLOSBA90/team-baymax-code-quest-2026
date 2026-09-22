/** Metadatos de paginación; coincide con PageMeta del frontend. */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Respuesta paginada { data, meta }; coincide con ApiPaginated del frontend. */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
