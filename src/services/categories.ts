import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type CategoryRow = Database['public']['Tables']['categories']['Row'];
type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

export interface Category {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// Helper function to convert database row to Category
const convertToCategory = (row: CategoryRow): Category => ({
  id: row.id,
  name: row.name,
  description: row.description,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const categories = {
  getAll: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data.map(convertToCategory);
  },

  getById: async (id: string): Promise<Category> => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return convertToCategory(data);
  },

  getByName: async (name: string): Promise<Category | null> => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('name', name)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }
    return convertToCategory(data);
  },

  create: async (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> => {
    const insertData: CategoryInsert = {
      name: category.name,
      description: category.description
    };

    const { data, error } = await supabase
      .from('categories')
      .insert(insertData)
      .select()
      .single();
    if (error) throw error;
    return convertToCategory(data);
  },

  update: async (id: string, updates: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Category> => {
    const updateData: CategoryUpdate = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;

    const { data, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return convertToCategory(data);
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Check if category is being used by any inventory items
  isUsed: async (categoryName: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('id')
      .eq('category', categoryName)
      .limit(1);
    
    if (error) throw error;
    return data.length > 0;
  }
};


