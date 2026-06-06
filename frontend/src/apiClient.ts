import type {
  Category,
  CreateReportDto,
  ListResponse,
  ProblemDetails,
  Report,
  UpdateReportDto,
  User
} from './types';

const API_URL = 'http://localhost:3000/api/v1';
const REQUEST_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  readonly status: number;
  readonly details: Record<string, unknown> | null;

  constructor(status: number, message: string, details: Record<string, unknown> | null = null) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      signal: controller.signal
    });

    if (response.status === 204) {
      return undefined as T;
    }

    const payload = await parseJson(response);

    if (!response.ok) {
      const problem = payload as ProblemDetails;
      throw new ApiError(response.status, problem.message || `HTTP ${response.status}`, problem.details);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(408, 'Час очікування вичерпано. Спробуйте ще раз.');
    }

    throw new ApiError(0, 'Backend недоступний. Перевірте, чи сервер працює на порту 3000.');
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(response.status, 'Сервер повернув некоректний JSON.');
  }
}

export const reportApi = {
  getList: () => request<ListResponse<Report>>('/reports?limit=100'),
  getById: (id: number) => request<Report>(`/reports/${id}`),
  create: (data: CreateReportDto) => request<Report>('/reports', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id: number, data: UpdateReportDto) => request<Report>(`/reports/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  remove: (id: number) => request<void>(`/reports/${id}`, {
    method: 'DELETE'
  })
};

export const referenceApi = {
  getUsers: () => request<ListResponse<User>>('/users?limit=100'),
  getCategories: () => request<ListResponse<Category>>('/categories?limit=100')
};
