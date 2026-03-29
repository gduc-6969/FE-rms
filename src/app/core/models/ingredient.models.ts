export type IngredientStatus = 'hoat_dong' | 'ngung_hoat_dong';

export interface IngredientResponse {
  id: number;
  name: string;
  unit: string;
  stockQuantity: number;
  minStockQuantity: number;
  status: IngredientStatus;
}

export interface IngredientRequest {
  name: string;
  unit: string;
  stockQuantity: number;
  minStockQuantity: number;
  status: IngredientStatus;
}
