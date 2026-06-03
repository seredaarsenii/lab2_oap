export interface UpdateReportDto {
  userId?: number;
  user_id?: number;
  categoryId?: number;
  category_id?: number;
  title?: string;
  severity?: 'Low' | 'Medium' | 'High';
  status?: 'Open' | 'Closed' | 'In Progress';
  description?: string;
  reporter?: string;
}
