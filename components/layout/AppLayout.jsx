'use client';

import { useSelector } from 'react-redux';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import ProtectedRoute from '../ProtectedRoute';
import WebSocketProvider from '../providers/WebSocketProvider';

export default function AppLayout({ children }) {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const pathname = usePathname();
  
  // Pages that don't need authentication
  const publicPages = ['/login', '/signup'];
  const isPublicPage = publicPages.includes(pathname);

  // For public pages (login/signup), render without layout
  if (isPublicPage) {
    return children;
  }

  // For protected pages, wrap with authentication and layout
  return (
    <ProtectedRoute>
      <WebSocketProvider>
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </WebSocketProvider>
    </ProtectedRoute>
  );
} 