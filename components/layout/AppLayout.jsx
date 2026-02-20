'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import ProtectedRoute from '../ProtectedRoute';
import WebSocketProvider from '../providers/WebSocketProvider';

export default function AppLayout({ children }) {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Pages that don't need authentication
  const publicPages = ['/login', '/signup'];
  const isPublicPage = publicPages.includes(pathname);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  // For public pages (login/signup), render without layout
  if (isPublicPage) {
    return children;
  }

  // For protected pages, wrap with authentication and layout
  return (
    <ProtectedRoute>
      <WebSocketProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />
          <div className="flex-1 flex flex-col min-w-0">
            <div className="sticky top-0 z-40">
              <Header onOpenSidebar={() => setIsMobileSidebarOpen(true)} />
            </div>
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </WebSocketProvider>
    </ProtectedRoute>
  );
} 
