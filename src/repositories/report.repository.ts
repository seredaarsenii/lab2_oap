export interface Report {
  id: string;
  title: string;
  severity: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'Closed' | 'In Progress';
  description: string;
  reporter: string;
}

class ReportRepository {
  // масив для зберігання даних у пам'яті 
  private reports: Report[] = [];

  async findAll() {
    return this.reports;
  }

  async findById(id: string) {
    return this.reports.find(r => r.id === id);
  }

  async create(data: Omit<Report, 'id' | 'status'>) {
    const newReport: Report = {
      ...data,
      id: Date.now().toString(), 
      status: 'Open' 
    };
    this.reports.push(newReport);
    return newReport;
  }

  async update(id: string, data: Partial<Report>) {
    const index = this.reports.findIndex(r => r.id === id);
    if (index === -1) return null;

    const existingReport = this.reports[index] as Report;

    const updatedReport: Report = { 
      ...existingReport, 
      ...data, 
      id: existingReport.id 
    };

    this.reports[index] = updatedReport;
    return updatedReport;
  }

  async delete(id: string) {
    const index = this.reports.findIndex(r => r.id === id);
    if (index === -1) return false;

    this.reports.splice(index, 1);
    return true;
  }
}

export const reportRepository = new ReportRepository();