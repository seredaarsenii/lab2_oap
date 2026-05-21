export interface CreateReportDto {
  title: string;
  severity: 'Low' | 'Medium' | 'High';
  description: string;
  reporter: string;
}