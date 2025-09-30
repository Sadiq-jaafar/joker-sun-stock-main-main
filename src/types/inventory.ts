export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  minPrice: number;
  maxPrice: number;
  cost: number;
  quantity: number;
  length?: number;
  measureType: 'standard' | 'length';
  description: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  item: InventoryItem;
  quantity: number;
  selectedPrice: number;
}

export interface Sale {
  id: string;
  items: CartItem[];
  total: number;
  soldBy: string;
  soldAt: string;
  receiptNumber: string;
  customerName: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export type UserRole = 'admin' | 'user';