export type Severity = 'Low' | 'Medium' | 'High';
export type ReportStatus = 'Open' | 'Closed' | 'In Progress';

export interface Report {
  id: number;
  user_id: number;
  category_id: number | null;
  title: string;
  severity: Severity;
  status: ReportStatus;
  description: string;
  reporter: string;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface CreateReportDto {
  userId: number;
  categoryId?: number;
  title: string;
  severity: Severity;
  description: string;
  reporter: string;
}

export interface UpdateReportDto {
  userId: number;
  categoryId?: number | null;
  title: string;
  severity: Severity;
  status: ReportStatus;
  description: string;
  reporter: string;
}

export interface ListResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface ProblemDetails {
  code: number;
  message: string;
  details: Record<string, unknown> | null;
  path?: string;
  timestamp?: string;
}

export interface LoginResponse {
  token: string;
  expiresIn: number;
  user: User;
}
