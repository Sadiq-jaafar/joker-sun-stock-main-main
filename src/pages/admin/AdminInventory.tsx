import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { InventoryItem } from "@/types/inventory";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export function AdminInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('inventory_items')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        if (!data) {
          throw new Error('No data received from the server');
        }

        const transformedData: InventoryItem[] = data.map(item => ({
          id: item.id,
          name: item.name || '',
          category: item.category || '',
          brand: item.brand || '',
          model: item.model || '',
          minPrice: Number(item.min_price) || 0,
          maxPrice: Number(item.max_price) || 0,
          cost: Number(item.cost) || 0,
          quantity: Number(item.quantity) || 0,
          length: item.length ? Number(item.length) : undefined,
          measureType: item.measure_type === 'length' ? 'length' : 'standard',
          description: item.description || '',
          image: item.image_url,
          createdAt: item.created_at || new Date().toISOString(),
          updatedAt: item.updated_at || new Date().toISOString()
        }));

        setItems(transformedData);
      } catch (error) {
        console.error('Error fetching inventory:', error);
        toast({
          variant: 'destructive',
          title: 'Error loading inventory',
          description: error instanceof Error ? error.message : 'Failed to load inventory items'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventory();
  }, [toast]);

  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    brand: "",
    model: "",
    minPrice: "",
    maxPrice: "",
    cost: "",
    quantity: "",
    length: "",
    measureType: "standard",
    description: ""
  });

  const categories = ["Solar Panels", "Solar Panel Belgium", "Electrical Items", "Wire", "Batteries", "Inverters", "Controllers", "Lighting", "Others"];

  const resetForm = () => {
    setNewItem({
      name: "",
      category: "",
      brand: "",
      model: "",
      minPrice: "",
      maxPrice: "",
      cost: "",
      quantity: "",
      length: "",
      measureType: "standard",
      description: ""
    });
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.category || !newItem.minPrice || !newItem.maxPrice || 
        (newItem.measureType === 'standard' && !newItem.quantity) || 
        (newItem.measureType === 'length' && !newItem.length)) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert([
          {
            name: newItem.name,
            category: newItem.category,
            brand: newItem.brand,
            model: newItem.model,
            min_price: parseFloat(newItem.minPrice),
            max_price: parseFloat(newItem.maxPrice),
            cost: parseFloat(newItem.cost) || 0,
            quantity: newItem.measureType === 'standard' ? parseInt(newItem.quantity) : 0,
            length: newItem.measureType === 'length' ? parseFloat(newItem.length) : null,
            measure_type: newItem.measureType,
            description: newItem.description
          }
        ])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        const newInventoryItem: InventoryItem = {
          id: data[0].id,
          name: data[0].name,
          category: data[0].category,
          brand: data[0].brand,
          model: data[0].model,
          minPrice: Number(data[0].min_price),
          maxPrice: Number(data[0].max_price),
          cost: Number(data[0].cost),
          quantity: Number(data[0].quantity),
          length: data[0].length ? Number(data[0].length) : undefined,
          measureType: data[0].measure_type === 'length' ? 'length' : 'standard',
          description: data[0].description,
          createdAt: data[0].created_at,
          updatedAt: data[0].updated_at
        };
        setItems([...items, newInventoryItem]);
        setIsAddDialogOpen(false);
        resetForm();
        toast({
          title: "Success",
          description: "Item added successfully!"
        });
      }
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        variant: 'destructive',
        title: 'Error adding item',
        description: error instanceof Error ? error.message : 'Failed to add item'
      });
    }
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      category: item.category,
      brand: item.brand,
      model: item.model,
      minPrice: item.minPrice.toString(),
      maxPrice: item.maxPrice.toString(),
      measureType: item.measureType,
      length: item.length?.toString() || '',
      cost: item.cost.toString(),
      quantity: item.quantity.toString(),
      description: item.description
    });
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .update({
          name: newItem.name,
          category: newItem.category,
          brand: newItem.brand,
          model: newItem.model,
          min_price: parseFloat(newItem.minPrice),
          max_price: parseFloat(newItem.maxPrice),
          cost: parseFloat(newItem.cost) || 0,
          quantity: newItem.measureType === 'standard' ? parseInt(newItem.quantity) : 0,
          length: newItem.measureType === 'length' ? parseFloat(newItem.length) : null,
          measure_type: newItem.measureType,
          description: newItem.description
        })
        .eq('id', editingItem.id)
        .select();

      if (error) throw error;

      if (data && data[0]) {
        const updatedItem: InventoryItem = {
          id: data[0].id,
          name: data[0].name,
          category: data[0].category,
          brand: data[0].brand,
          model: data[0].model,
          minPrice: Number(data[0].min_price),
          maxPrice: Number(data[0].max_price),
          cost: Number(data[0].cost),
          quantity: Number(data[0].quantity),
          length: data[0].length ? Number(data[0].length) : undefined,
          measureType: data[0].measure_type === 'length' ? 'length' : 'standard',
          description: data[0].description,
          createdAt: data[0].created_at,
          updatedAt: data[0].updated_at
        };
        setItems(items.map(item => item.id === editingItem.id ? updatedItem : item));
        setEditingItem(null);
        resetForm();
        toast({
          title: "Success",
          description: "Item updated successfully!"
        });
      }
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        variant: 'destructive',
        title: 'Error updating item',
        description: error instanceof Error ? error.message : 'Failed to update item'
      });
    }
    
    toast({
      title: "Success",
      description: "Item updated successfully!"
    });
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setItems(items.filter(item => item.id !== id));
      toast({
        title: "Success",
        description: "Item deleted successfully!"
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        variant: 'destructive',
        title: 'Error deleting item',
        description: error instanceof Error ? error.message : 'Failed to delete item'
      });
    }
    setItems(items.filter(item => item.id !== id));
    toast({
      title: "Success",
      description: "Item deleted successfully!"
    });
  };

  const getStockStatus = (quantity: number, item: InventoryItem) => {
    if (item.measureType === 'length') {
      if (!item.length || item.length === 0) return { label: "Out of Stock", variant: "destructive" as const };
      if (item.length < 10) return { label: "Low Stock", variant: "secondary" as const };
      return { label: "In Stock", variant: "default" as const };
    } else {
      if (quantity === 0) return { label: "Out of Stock", variant: "destructive" as const };
      if (quantity < 10) return { label: "Low Stock", variant: "secondary" as const };
      return { label: "In Stock", variant: "default" as const };
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            Inventory Management
          </h1>
          <p className="text-muted-foreground mt-1">Add, edit, and manage your store inventory</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
              <DialogDescription>
                Add a new item to your inventory
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={newItem.brand}
                  onChange={(e) => setNewItem({ ...newItem, brand: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={newItem.model}
                  onChange={(e) => setNewItem({ ...newItem, model: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minPrice">Minimum Price (₦) *</Label>
                <Input
                  id="minPrice"
                  type="number"
                  value={newItem.minPrice}
                  onChange={(e) => setNewItem({ ...newItem, minPrice: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxPrice">Maximum Price (₦) *</Label>
                <Input
                  id="maxPrice"
                  type="number"
                  value={newItem.maxPrice}
                  onChange={(e) => setNewItem({ ...newItem, maxPrice: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost (₦)</Label>
                <Input
                  id="cost"
                  type="number"
                  value={newItem.cost}
                  onChange={(e) => setNewItem({ ...newItem, cost: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="measureType">Measure Type *</Label>
                <Select value={newItem.measureType} onValueChange={(value) => setNewItem({ ...newItem, measureType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select measure type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="length">Length</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                {newItem.measureType === 'standard' ? (
                  <>
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    />
                  </>
                ) : (
                  <>
                    <Label htmlFor="length">Length *</Label>
                    <Input
                      id="length"
                      type="number"
                      step="0.01"
                      value={newItem.length}
                      onChange={(e) => setNewItem({ ...newItem, length: e.target.value })}
                    />
                  </>
                )}
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => {setIsAddDialogOpen(false); resetForm();}}>
                Cancel
              </Button>
              <Button onClick={handleAddItem}>Add Item</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{items.length}</div>
            <p className="text-sm text-muted-foreground">Total Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              {items.reduce((sum, item) => sum + item.quantity, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Total Quantity</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              ₦{items.reduce((sum, item) => sum + (item.minPrice * (item.measureType === 'standard' ? item.quantity : (item.length || 0))), 0).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Total Value</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-destructive">
              {items.filter(item => item.quantity < 10).length}
            </div>
            <p className="text-sm text-muted-foreground">Low Stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>Manage your store inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Brand/Model</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const status = getStockStatus(item.quantity, item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        {item.brand} {item.model && `- ${item.model}`}
                      </TableCell>
                      <TableCell>₦{item.minPrice.toFixed(2)} - ₦{item.maxPrice.toFixed(2)}</TableCell>
                      <TableCell>
                        {item.measureType === 'standard' 
                          ? item.quantity 
                          : `${item.length?.toFixed(2)} meters`}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditItem(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Update item information
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category *</Label>
              <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-brand">Brand</Label>
              <Input
                id="edit-brand"
                value={newItem.brand}
                onChange={(e) => setNewItem({ ...newItem, brand: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-model">Model</Label>
              <Input
                id="edit-model"
                value={newItem.model}
                onChange={(e) => setNewItem({ ...newItem, model: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-minPrice">Minimum Price (₦) *</Label>
              <Input
                id="edit-minPrice"
                type="number"
                value={newItem.minPrice}
                onChange={(e) => setNewItem({ ...newItem, minPrice: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-maxPrice">Maximum Price (₦) *</Label>
              <Input
                id="edit-maxPrice"
                type="number"
                value={newItem.maxPrice}
                onChange={(e) => setNewItem({ ...newItem, maxPrice: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cost">Cost (₦)</Label>
              <Input
                id="edit-cost"
                type="number"
                value={newItem.cost}
                onChange={(e) => setNewItem({ ...newItem, cost: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-measureType">Measure Type *</Label>
              <Select value={newItem.measureType} onValueChange={(value) => setNewItem({ ...newItem, measureType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select measure type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="length">Length</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              {newItem.measureType === 'standard' ? (
                <>
                  <Label htmlFor="edit-quantity">Quantity *</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  />
                </>
              ) : (
                <>
                  <Label htmlFor="edit-length">Length *</Label>
                  <Input
                    id="edit-length"
                    type="number"
                    step="0.01"
                    value={newItem.length}
                    onChange={(e) => setNewItem({ ...newItem, length: e.target.value })}
                  />
                </>
              )}
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => {setEditingItem(null); resetForm();}}>
              Cancel
            </Button>
            <Button onClick={handleUpdateItem}>Update Item</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}