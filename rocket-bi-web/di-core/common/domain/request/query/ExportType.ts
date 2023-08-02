export enum ExportType {
  CSV = 'csv',
  XLSX = 'xlsx'
}

export const ExportTypeDisplayNames: Record<ExportType, string> = {
  [ExportType.CSV]: 'CSV',
  [ExportType.XLSX]: 'Excel'
};
