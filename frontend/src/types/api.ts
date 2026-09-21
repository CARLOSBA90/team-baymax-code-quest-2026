export interface ApiResponse<T> {
  data: T;
}

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiPaginated<T> {
  data: T[];
  meta: PageMeta;
}

export interface ApiMessage<T> {
  message: string;
  data: T;
}
