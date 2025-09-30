import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Package, Search, FileText, CreditCard } from "lucide-react";
import { Sale, InventoryItem } from "@/types/inventory";

interface DBCreditSaleItem {
  quantity: number;
  unit_price: number;
  item: {
    id: string;
    name: string;
    category: string;
    brand: string;
    model: string;
    min_price: number;
    max_price: number;
    cost: number;
    quantity: number;
    measure_type: 'standard' | 'length';
    description: string;
    created_at: string;
    updated_at: string;
  };
}

interface DBInventoryItem {
  id: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  min_price: number;
  max_price: number;
  cost: number;
  quantity: number;
  measure_type: 'standard' | 'length';
  description: string;
  created_at: string;
  updated_at: string;
}

interface DBCreditSaleResponse {
  id: string;
  receipt_number: string;
  customer_name: string;
  total: number;
  amount_paid: number;
  remaining_amount: number;
  due_date: string;
  notes: string | null;
  status: 'pending' | 'partially_paid' | 'paid';
  sold_at: string;
  sold_by: string;
  credit_sale_items?: { quantity: number; unit_price: number; item: DBInventoryItem }[];
}

interface CreditSale extends Sale {
  status: 'pending' | 'partially_paid' | 'paid';
  amountPaid: number;
  remainingAmount: number;
  dueDate: string;
  notes?: string;
}

export function AdminCredit() {
  const { toast } = useToast();
  const [creditSales, setCreditSales] = useState<CreditSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Fetch credit sales data
  useEffect(() => {
    const fetchCreditSales = async () => {
      try {
        setIsLoading(true);
        const { data: salesData, error: salesError } = await supabase
          .from('credit_sales')
          .select(`
            id,
            receipt_number,
            customer_name,
            total,
            amount_paid,
            remaining_amount,
            due_date,
            notes,
            status,
            sold_at,
            sold_by,
            credit_sale_items(quantity, unit_price, item:inventory_items(*))
          `)
          .order('sold_at', { ascending: false });

        if (salesError) throw salesError;

        // Transform the data
        const transformedSales: CreditSale[] = salesData?.map(sale => ({
          id: sale.id,
          receiptNumber: sale.receipt_number,
          customerName: sale.customer_name,
          total: sale.total,
          amountPaid: sale.amount_paid,
          remainingAmount: sale.remaining_amount,
          dueDate: sale.due_date,
          notes: sale.notes,
          status: sale.status,
          soldAt: sale.sold_at,
          soldBy: sale.sold_by,
          items: ((sale.credit_sale_items || []) as unknown as Array<{ quantity: number; unit_price: number; item: DBInventoryItem }>).map((saleItem) => ({
            item: {
              id: saleItem.item.id,
              name: saleItem.item.name,
              category: saleItem.item.category,
              brand: saleItem.item.brand,
              model: saleItem.item.model,
              minPrice: saleItem.item.min_price,
              maxPrice: saleItem.item.max_price,
              cost: saleItem.item.cost,
              quantity: saleItem.item.quantity,
              measureType: saleItem.item.measure_type,
              description: saleItem.item.description,
              createdAt: saleItem.item.created_at,
              updatedAt: saleItem.item.updated_at
            },
            quantity: saleItem.quantity,
            selectedPrice: saleItem.unit_price
          }))
        })) || [];

        setCreditSales(transformedSales);
      } catch (error) {
        console.error('Error fetching credit sales:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load credit sales data'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreditSales();
  }, [toast]);

  const filteredSales = creditSales.filter(sale => {
    const matchesSearch = sale.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.items.some(item => item.item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filterBy === "all") return matchesSearch;
    return matchesSearch && sale.status === filterBy;
  }).sort((a, b) => {
    if (sortBy === "newest") return new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime();
    if (sortBy === "oldest") return new Date(a.soldAt).getTime() - new Date(b.soldAt).getTime();
    if (sortBy === "highest") return b.remainingAmount - a.remainingAmount;
    if (sortBy === "lowest") return a.remainingAmount - b.remainingAmount;
    return 0;
  });

  const totalCredit = creditSales.reduce((sum, sale) => sum + sale.remainingAmount, 0);
  const totalPaid = creditSales.reduce((sum, sale) => sum + sale.amountPaid, 0);
  const pendingPayments = creditSales.filter(sale => sale.status !== 'paid').length;

  const getStatusBadge = (status: CreditSale['status']) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'partially_paid':
        return <Badge className="bg-yellow-100 text-yellow-800">Partially Paid</Badge>;
      case 'pending':
        return <Badge className="bg-red-100 text-red-800">Pending</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-primary" />
            Credit Sales
          </h1>
          <p className="text-muted-foreground mt-1">Manage and track credit sales</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Credit Amount</span>
            </div>
            <div className="text-2xl font-bold text-primary">
              ₦{totalCredit.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Paid Amount</span>
            </div>
            <div className="text-2xl font-bold text-green-600">₦{totalPaid.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Pending Payments</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{pendingPayments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Sales History</CardTitle>
          <CardDescription>View and manage credit sales transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by receipt, customer, or item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partially_paid">Partially Paid</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="highest">Highest Amount</SelectItem>
                <SelectItem value="lowest">Lowest Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Paid Amount</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.receiptNumber}</TableCell>
                    <TableCell>{sale.customerName}</TableCell>
                    <TableCell>₦{sale.total.toFixed(2)}</TableCell>
                    <TableCell className="text-green-600">₦{sale.amountPaid.toFixed(2)}</TableCell>
                    <TableCell className="text-red-600">₦{sale.remainingAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{new Date(sale.dueDate).toLocaleDateString()}</span>
                        {new Date(sale.dueDate) < new Date() && sale.status !== 'paid' && (
                          <span className="text-xs text-red-600">Overdue</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(sale.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // TODO: Implement payment recording
                          toast({
                            title: "Coming Soon",
                            description: "Payment recording feature will be available soon."
                          });
                        }}
                      >
                        Record Payment
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredSales.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No credit sales found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}