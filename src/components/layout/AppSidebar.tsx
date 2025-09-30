import { useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter
} from "@/components/ui/sidebar";
  import { 
    LayoutDashboard, 
    Package, 
    Users, 
    Settings,
    ShoppingCart,
    Zap,
    TrendingUp,
    CreditCard
  } from "lucide-react";
import { UserRole } from "@/types/inventory";
import { NavLink, useLocation } from "react-router-dom";

interface AppSidebarProps {
  currentUser: { id: string; name: string; role: UserRole };
}

export function AppSidebar({ currentUser }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const navigation = [
    { id: "dashboard", name: "Dashboard", icon: LayoutDashboard, href: "/" },
    { id: "inventory", name: "Inventory", icon: Package, href: "/inventory" },
    ...(currentUser.role === 'admin' ? [
      { id: "admin-inventory", name: "Manage Inventory", icon: Settings, href: "/admin/inventory" },
      { id: "admin-users", name: "Manage Users", icon: Users, href: "/admin/users" },
      { id: "admin-sales", name: "Sales Reports", icon: TrendingUp, href: "/admin/sales" },
      { id: "admin-credit", name: "Credit Sales", icon: CreditCard, href: "/admin/credit" }
    ] : [])
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b bg-slate-500 border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-sidebar-foreground">Jokahh Solar</h2>
            <p className="text-xs text-sidebar-foreground/60">Electronics Store</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarMenu>
          {navigation.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton asChild>
                <NavLink 
                  to={item.href}
                  className={({ isActive }) => cn(
                    "w-full justify-start",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        {/* Cart button removed - now handled by individual pages */}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer hover:bg-sidebar-accent rounded-lg p-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-sm font-medium text-primary-foreground">
                  {currentUser.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {currentUser.name}
                </p>
                <p className="text-xs text-sidebar-foreground/60 capitalize">
                  {currentUser.role}
                </p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setIsChangePasswordOpen(true)}>
              Change Password
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              // Clear any auth tokens/state
              localStorage.removeItem("authToken");
              // Redirect to login
              navigate("/login");
              toast({
                title: "Logged out",
                description: "You have been successfully logged out."
              });
            }}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Change Password Dialog */}
        <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => {
                setIsChangePasswordOpen(false);
                setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
              }}>
                Cancel
              </Button>
              <Button onClick={async () => {
                // Validate passwords
                if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
                  toast({
                    title: "Error",
                    description: "All fields are required.",
                    variant: "destructive"
                  });
                  return;
                }

                if (passwordData.newPassword !== passwordData.confirmPassword) {
                  toast({
                    title: "Error",
                    description: "New passwords don't match.",
                    variant: "destructive"
                  });
                  return;
                }

                try {
                  // First verify current password
                  const { data: userData, error: verifyError } = await supabase
                    .from('users')
                    .select('password')
                    .eq('id', currentUser.id)
                    .single();

                  if (verifyError) throw verifyError;
                  if (userData.password !== passwordData.currentPassword) {
                    toast({
                      title: "Error",
                      description: "Current password is incorrect.",
                      variant: "destructive"
                    });
                    return;
                  }

                  // Update password
                  const { error: updateError } = await supabase
                    .from('users')
                    .update({ 
                      password: passwordData.newPassword,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', currentUser.id);

                  if (updateError) throw updateError;

                  toast({
                    title: "Success",
                    description: "Password has been changed successfully."
                  });

                  setIsChangePasswordOpen(false);
                  setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                } catch (error) {
                  console.error('Error changing password:', error);
                  toast({
                    title: "Error",
                    description: "Failed to change password. Please try again.",
                    variant: "destructive"
                  });
                }
              }}>
                Change Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarFooter>
    </Sidebar>
  );
}