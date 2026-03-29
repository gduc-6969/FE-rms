export type CategoryStatus = 'hoat_dong' | 'ngung_hoat_dong';

export interface CategoryResponse {
  id: number;
  name: string;
  status: CategoryStatus;
}
