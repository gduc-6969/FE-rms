// Report Summary
export interface ReportSummaryResponse {
  totalRevenue: number;
  avgOrderValue: number;
  totalOrders: number;
}

// Monthly Report
export interface MonthlyReportResponse {
  month: string;
  revenue: number;
  orders: number;
}

// Category Report
export interface CategoryReportResponse {
  categoryName: string;
  sales: number;
  revenue: number;
  percentage: number;
}

// Best Seller
export interface BestSellerResponse {
  rank: number;
  name: string;
  sales: number;
  revenue: number;
  percentage: number;
}

// Top Selling Item (from Statistics API)
export interface TopSellingItemResponse {
  rank: number;
  menuItemId: number;
  menuItemName: string;
  categoryName: string;
  totalQuantitySold: number;
  totalRevenue: number;
  imageUrl: string;
}
