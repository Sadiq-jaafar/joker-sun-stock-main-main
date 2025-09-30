import { useState, cloneElement, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useNavigate } from "react-router-dom";

interface DashboardLayoutProps {
  children: React.ReactElement;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    setCurrentUser(JSON.parse(userData));
  }, [navigate]);

  if (!currentUser) {
    return null; // or a loading spinner
  }

  // Clone the child element and pass the currentUser prop
  const childWithProps = cloneElement(children, { currentUser });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background relative">
        <AppSidebar 
          currentUser={currentUser}
        />
        <main className="flex-1 overflow-x-hidden w-full relative">
          <div className="sticky top-0 left-0 z-50 p-4 md:hidden">
            <SidebarTrigger className="absolute top-4 left-4 rounded-lg border border-input bg-background shadow-sm hover:bg-accent" />
          </div>
          {childWithProps}
        </main>
      </div>
    </SidebarProvider>
  );
}