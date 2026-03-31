export type TableStatus = 'trong' | 'da_dat' | 'dang_phuc_vu' | 'bao_tri';

export interface TableResponse {
  id: number;
  tableCode: string;
  capacity: number;
  status: TableStatus;
}

export interface TableRequest {
  tableCode: string;
  capacity: number;
  status?: TableStatus;
}

export const TABLE_STATUS_LABELS: Record<TableStatus, string> = {
  'trong': 'Available',
  'da_dat': 'Reserved',
  'dang_phuc_vu': 'Serving',
  'bao_tri': 'Maintenance'
};

export const TABLE_STATUS_OPTIONS: { value: TableStatus; label: string }[] = [
  { value: 'trong', label: 'Available' },
  { value: 'da_dat', label: 'Reserved' },
  { value: 'dang_phuc_vu', label: 'Serving' },
  { value: 'bao_tri', label: 'Maintenance' }
];
