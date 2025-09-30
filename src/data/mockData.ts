import { InventoryItem, User } from '@/types/inventory';

export const mockInventoryItems: InventoryItem[] = [
  {
    id: '1',
    name: 'Solar Panel 300W',
    category: 'Solar Panels',
    brand: 'SunPower',
    model: 'SP-300M',
    minPrice: 250.00,
    maxPrice: 300.00,
    cost: 180.00,
    quantity: 50,
    measureType: 'standard',
    description: 'High-efficiency monocrystalline solar panel',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    name: 'Battery Storage 100Ah',
    category: 'Batteries',
    brand: 'Tesla',
    model: 'LFP-100',
    minPrice: 800.00,
    maxPrice: 900.00,
    cost: 600.00,
    quantity: 25,
    measureType: 'standard',
    description: 'Lithium iron phosphate battery for solar storage',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '3',
    name: 'Inverter 5kW',
    category: 'Inverters',
    brand: 'Fronius',
    model: 'Primo-5K',
    minPrice: 1200.00,
    maxPrice: 1400.00,
    cost: 900.00,
    quantity: 15,
    measureType: 'standard',
    description: 'String inverter for residential solar systems',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '4',
    name: 'Wire 2.5mm²',
    category: 'Wire',
    brand: 'ElectroCable',
    model: 'THHN-2.5',
    minPrice: 2.50,
    maxPrice: 3.00,
    cost: 1.80,
    quantity: 0,
    length: 500,
    measureType: 'length',
    description: 'High-quality electrical wire',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '5',
    name: 'LED Floodlight 50W',
    category: 'Lighting',
    brand: 'Philips',
    model: 'LED-50W-Solar',
    minPrice: 80.00,
    maxPrice: 95.00,
    cost: 55.00,
    quantity: 100,
    measureType: 'standard',
    description: 'Solar-powered LED floodlight for outdoor use',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  }
];

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Admin',
    email: 'admin@jokersolar.com',
    role: 'admin',
    createdAt: '2024-01-01T10:00:00Z'
  },
  {
    id: '2',
    name: 'Sarah Sales',
    email: 'sarah@jokersolar.com',
    role: 'user',
    createdAt: '2024-01-05T10:00:00Z'
  },
  {
    id: '3',
    name: 'Mike Merchant',
    email: 'mike@jokersolar.com',
    role: 'user',
    createdAt: '2024-01-10T10:00:00Z'
  }
];