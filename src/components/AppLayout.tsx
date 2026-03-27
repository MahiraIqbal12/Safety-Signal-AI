import { ReactNode, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "@/components/AppSidebar";
import TopBar from "@/components/TopBar";

const AppLayout = ({ children, title }: { children: ReactNode; title: string }) => {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Determine initial sidebar state based on screen size
  useEffect(() => {
    const checkScreenSize = () => {
      // Desktop: always open sidebar, Mobile: always closed
      const isDesktop = window.innerWidth >= 768; // md breakpoint
      setSidebarOpen(isDesktop);
    };

    // Set initial state
    checkScreenSize();

    // Add resize listener for responsive behavior
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (!isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar - Desktop: always visible, Mobile: collapsible */}
      <AppSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      {/* Mobile Backdrop - Only shows on mobile when sidebar is open */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 md:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Content Area - Takes remaining space, adjusts for sidebar on desktop */}
      <div className={`flex-1 flex flex-col min-w-0 ${sidebarOpen ? 'md:ml-64' : ''}`}>
        <TopBar 
          title={title} 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />
        <main className="flex-1 p-6 md:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
