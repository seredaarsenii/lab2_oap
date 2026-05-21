export interface UpdateReportDto {
  title?: string;
  severity?: 'Low' | 'Medium' | 'High';
  status?: 'Open' | 'Closed' | 'In Progress';
  description?: string;
  reporter?: string;
}