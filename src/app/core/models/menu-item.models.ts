export type MenuItemStatus = 'con_ban' | 'het_mon' | 'ngung_ban';

export interface MenuItemResponse {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  status: MenuItemStatus;
  categoryId: number;
  categoryName: string;
}

export interface MenuItemRequest {
  name: string;
  price: number;
  imageUrl: string;
  status: MenuItemStatus;
  categoryId: number;
}
