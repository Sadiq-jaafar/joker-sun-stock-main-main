import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Package, TrendingUp, Users, ShoppingCart } from "lucide-react";
import { mockInventoryItems, mockUsers } from "@/data/mockData";
import { UserRole } from "@/types/inventory";

interface DashboardProps {
  currentUser: { name: string; role: UserRole };
}

export function Dashboard({ currentUser }: DashboardProps) {
  const totalItems = mockInventoryItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = mockInventoryItems.reduce((sum, item) => sum + (item.minPrice * item.quantity), 0);
  const lowStockItems = mockInventoryItems.filter(item => item.quantity < 3);

  return (
    <div className=" flex flex-col min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <div className="relative  bg-yellow-500 overflow-hidden bg-gradient-primary text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-6 py-24">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4 bg-yellow-500 text-white border-white/20">
              Welcome back, {currentUser.name}!
            </Badge>
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Jokahh Solar Solution JSS
              <span className="block text-3xl font-normal opacity-90 mt-2">
                Electronics Store Management
              </span>
            </h1>
            <p className="text-xl mb-8 opacity-90 leading-relaxed">
              Manage your solar equipment inventory, track sales, and grow your sustainable energy business with our comprehensive management system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                <Package className="mr-2 h-5 w-5" />
                View Inventory
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {currentUser.role === 'admin' && (
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <Users className="mr-2 h-5 w-5" />
                  Admin Panel
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white/5 rounded-full"></div>
        <div className="absolute bottom-0 left-0 -mb-32 -ml-32 w-96 h-96 bg-white/5 rounded-full"></div>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto px-6 -mt-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalItems}</div>
              <p className="text-xs text-muted-foreground">
                Across {mockInventoryItems.length} product types
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">₦{totalValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Current inventory value
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
              <ShoppingCart className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{lowStockItems.length}</div>
              <p className="text-xs text-muted-foreground">
                Items below 10 units
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="container mx-auto px-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates in your store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New inventory added</p>
                  <p className="text-xs text-muted-foreground">Solar Panel 300W - 50 units</p>
                </div>
                <span className="text-xs text-muted-foreground">2h ago</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Sale completed</p>
                  <p className="text-xs text-muted-foreground">Battery Storage - ₦800</p>
                </div>
                <span className="text-xs text-muted-foreground">4h ago</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Low stock warning</p>
                  <p className="text-xs text-muted-foreground">Inverter 5kW - 15 units left</p>
                </div>
                <span className="text-xs text-muted-foreground">1d ago</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="ghost">
                <Package className="mr-2 h-4 w-4" />
                View All Inventory
              </Button>
              <Button className="w-full justify-start" variant="ghost">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Start New Sale
              </Button>
              {currentUser.role === 'admin' && (
                <>
                  <Button className="w-full justify-start" variant="ghost">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Users
                  </Button>
                  <Button className="w-full justify-start" variant="ghost">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    View Sales Reports
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}