import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Sale = Database['public']['Tables']['sales']['Row'];
type SaleInsert = Database['public']['Tables']['sales']['Insert'];
type SaleItem = Database['public']['Tables']['sale_items']['Row'];
type SaleItemInsert = Database['public']['Tables']['sale_items']['Insert'];

export const sales = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          *,
          inventory_items (*)
        )
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          *,
          inventory_items (*)
        )
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  create: async (
    saleData: Omit<SaleInsert, 'id'>, 
    items: Array<Omit<SaleItemInsert, 'id' | 'sale_id'>>
  ) => {
    // Start a Supabase transaction
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert(saleData)
      .select()
      .single();

    if (saleError) throw saleError;

    // Insert sale items
    const saleItems = items.map(item => ({
      ...item,
      sale_id: sale.id
    }));

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems);

    if (itemsError) {
      // If there's an error inserting items, delete the sale
      await supabase.from('sales').delete().eq('id', sale.id);
      throw itemsError;
    }

    // Update inventory quantities
    for (const item of items) {
      await supabase.rpc('update_inventory_quantity', {
        item_id: item.item_id,
        quantity_change: -item.quantity
      });
    }

    return sale;
  },

  getSalesByDateRange: async (startDate: string, endDate: string) => {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          *,
          inventory_items (*)
        )
      `)
      .gte('sold_at', startDate)
      .lte('sold_at', endDate)
      .order('sold_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  getTopSellingItems: async (limit = 10) => {
    // Using a raw SQL query via RPC for aggregation
    const { data, error } = await supabase.rpc('get_top_selling_items', { limit_count: limit });

    if (error) throw error;
    return data;
  }
};