export interface ApiError {
  timestamp: string;
  status: number;
  message: string;
  fieldErrors: Record<string, string> | null;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
