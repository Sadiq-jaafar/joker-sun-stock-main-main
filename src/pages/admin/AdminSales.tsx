import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import autoTable from 'jspdf-autotable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Calendar, DollarSign, Package, Search, FileText, Download, Menu } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { Sale, InventoryItem } from "@/types/inventory";

interface RawSaleItem {
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
  quantity: number;
  unit_price: number;
}

export function AdminSales() {
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch sales data
  useEffect(() => {
    const fetchSales = async () => {
      try {
        setIsLoading(true);
        const { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select(`
            id,
            receipt_number,
            customer_name,
            total,
            sold_at,
            sold_by,
            sale_items (*, item: inventory_items (*))
          `)
          .order('sold_at', { ascending: false });

        if (salesError) throw salesError;

        // Transform the data to match our Sale type
        const transformedSales: Sale[] = salesData?.map(sale => ({
          id: sale.id,
          receiptNumber: sale.receipt_number,
          customerName: sale.customer_name,
          total: sale.total,
          soldAt: sale.sold_at,
          soldBy: sale.sold_by,
          items: sale.sale_items.map((saleItem: RawSaleItem) => ({
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

        setSales(transformedSales);
      } catch (error) {
        console.error('Error fetching sales:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load sales data'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSales();
  }, [toast]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.soldBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.items.some(item => item.item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filterBy === "all") return matchesSearch;
    return matchesSearch && sale.soldBy === filterBy;
  }).sort((a, b) => {
    if (sortBy === "newest") return new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime();
    if (sortBy === "oldest") return new Date(a.soldAt).getTime() - new Date(b.soldAt).getTime();
    if (sortBy === "highest") return b.total - a.total;
    if (sortBy === "lowest") return a.total - b.total;
    return 0;
  });

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalSales = sales.length;
  const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;
  const uniqueSellers = [...new Set(sales.map(sale => sale.soldBy))];

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(20);
    doc.text('Sales Report', 14, 20);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    // Add summary statistics
    doc.text('Summary', 14, 40);
    doc.text(`Total Revenue: ₦${totalRevenue.toLocaleString()}`, 14, 50);
    doc.text(`Total Sales: ${totalSales}`, 14, 60);
    doc.text(`Average Sale: ₦${averageSale.toFixed(2)}`, 14, 70);

    // Prepare table data
    const tableData = filteredSales.map(sale => [
      sale.receiptNumber,
      sale.items.map(item => `${item.quantity}x ${item.item.name} (₦${item.selectedPrice.toFixed(2)} each)`).join('\n'),
      `₦${sale.total.toFixed(2)}`,
      sale.customerName,
      sale.soldBy,
      new Date(sale.soldAt).toLocaleDateString(),
      'Completed'
    ]);

    // Add sales table
    autoTable(doc, {
      startY: 80,
      head: [['Receipt #', 'Items', 'Total', 'Customer', 'Sold By', 'Date', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [63, 63, 70] },
      styles: { fontSize: 10 },
      margin: { top: 80 }
    });

    // Save the PDF
    doc.save('sales-report.pdf');
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const saleDate = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - saleDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return saleDate.toLocaleDateString();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            Sales Reports
          </h1>
          <p className="text-muted-foreground mt-1">Track sales performance and revenue</p>
        </div>
        <Button className="gap-2" onClick={generatePDF}>
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Revenue</span>
            </div>
            <div className="text-2xl font-bold text-primary">
              ₦{totalRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Sales</span>
            </div>
            <div className="text-2xl font-bold text-primary">{totalSales}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Average Sale</span>
            </div>
            <div className="text-2xl font-bold text-primary">
              ₦{averageSale.toFixed(0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Items Sold</span>
            </div>
            <div className="text-2xl font-bold text-primary">
              {sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Sales History</CardTitle>
          <CardDescription>View and filter all sales transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by receipt, seller, or item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by seller" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sellers</SelectItem>
                {uniqueSellers.map((seller) => (
                  <SelectItem key={seller} value={seller}>{seller}</SelectItem>
                ))}
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
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Sold By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.receiptNumber}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {sale.items.map((item, index) => (
                          <div key={index} className="text-sm">
                            {item.quantity}x {item.item.name} (₦{item.selectedPrice.toFixed(2)} each)
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      ₦{sale.total.toFixed(2)}
                    </TableCell>
                    <TableCell>{sale.customerName}</TableCell>
                    <TableCell>{sale.soldBy}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{new Date(sale.soldAt).toLocaleDateString()}</span>
                        <span className="text-xs text-muted-foreground">
                          {getTimeAgo(sale.soldAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Completed
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredSales.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No sales found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}