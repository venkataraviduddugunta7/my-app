'use client';

import { cn } from "@/lib/utils";
import { useSelector, useDispatch } from 'react-redux';
import { toggleSidebar } from '@/store/slices/uiSlice';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Building,
  Users,
  CreditCard,
  Settings,
  BarChart3,
  Menu,
  X,
  Bell,
  FileText
} from 'lucide-react';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home
  },
  {
    name: 'Rooms',
    href: '/rooms',
    icon: Building
  },
  {
    name: 'Tenants',
    href: '/tenants',
    icon: Users
  },
  {
    name: 'Payments',
    href: '/payments',
    icon: CreditCard
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: BarChart3
  },
  {
    name: 'Notices',
    href: '/notices',
    icon: Bell
  },
  {
    name: 'Documents',
    href: '/documents',
    icon: FileText
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings
  }
];

export function Sidebar() {
  const { sidebarOpen } = useSelector((state) => state.ui);
  const dispatch = useDispatch();
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => dispatch(toggleSidebar())}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">PG Manager</h1>
          </div>
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700" 
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">PO</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">PG Owner</p>
              <p className="text-xs text-gray-500 truncate">owner@pgmanager.com</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function SidebarToggle() {
  const dispatch = useDispatch();
  
  return (
    <button
      onClick={() => dispatch(toggleSidebar())}
      className="lg:hidden p-2 rounded-md hover:bg-gray-100"
    >
      <Menu className="w-5 h-5 text-gray-500" />
    </button>
  );
} 