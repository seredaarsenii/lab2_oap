export interface CreateReportDto {
  userId?: number;
  user_id?: number;
  categoryId?: number;
  category_id?: number;
  title: string;
  severity: 'Low' | 'Medium' | 'High';
  description: string;
  reporter: string;
}
