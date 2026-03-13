'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Bed,
  CreditCard,
  FileText,
  Bell,
  Settings,
  BarChart3,
  Home,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from 'lucide-react';
import { Logo } from '@/components/ui';
import { logoutUser } from '@/store/slices/authSlice';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { id: 'properties', label: 'Properties', icon: Building2, href: '/properties' },
  { id: 'tenants', label: 'Tenants', icon: Users, href: '/tenants' },
  { id: 'rooms', label: 'Rooms & Beds', icon: Bed, href: '/rooms' },
  { id: 'payments', label: 'Payments', icon: CreditCard, href: '/payments' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/analytics' },
  { id: 'reports', label: 'Reports', icon: BarChart3, href: '/reports' },
  { id: 'notices', label: 'Notices', icon: Bell, href: '/notices' },
  { id: 'documents', label: 'Documents', icon: FileText, href: '/documents' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
];

export function Sidebar({ isMobileOpen = false, onCloseMobile }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const buttonRefs = useRef({});
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { selectedProperty } = useSelector((state) => state.property);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobileView = window.innerWidth < 1024;
      setIsMobile(mobileView);

      if (mobileView) {
        setIsCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isMobileOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onCloseMobile?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileOpen, onCloseMobile]);

  const isActiveRoute = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const handleNavigation = (href) => {
    router.push(href);
    if (isMobile) {
      onCloseMobile?.();
    }
  };

  const sidebarVariants = {
    expanded: { width: 288 },
    collapsed: { width: 88 },
  };

  const isSidebarCollapsed = !isMobile && isCollapsed;

  return (
    <>
      {isMobile && isMobileOpen && (
        <button
          type="button"
          onClick={() => onCloseMobile?.()}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] lg:hidden"
          aria-label="Close sidebar"
        />
      )}
      <motion.aside
        initial="expanded"
        animate={isSidebarCollapsed ? 'collapsed' : 'expanded'}
        variants={sidebarVariants}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-white/10 bg-[radial-gradient(circle_at_-34%_-18%,rgba(56,189,248,0.10),rgba(15,23,42,0.90)_34%,rgba(2,6,23,0.96)_100%)] text-slate-100 backdrop-blur-2xl shadow-[inset_-1px_0_0_rgba(255,255,255,0.05)] transition-transform duration-200 lg:relative lg:z-40 lg:translate-x-0 ${
          isMobile && !isMobileOpen ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        {!isMobile && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="fixed top-3 z-[60] flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/[0.10] text-slate-200 backdrop-blur-xl transition-all duration-150 hover:border-white/30 hover:bg-white/[0.16] hover:text-white"
            style={{ left: isSidebarCollapsed ? '4.05rem' : '17.05rem' }}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="relative inline-flex items-center justify-center">
              <PanelLeft className="h-[17px] w-[17px] opacity-85" />
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="absolute h-[17px] w-[17px] stroke-[2.2]" />
              ) : (
                <PanelLeftClose className="absolute h-[17px] w-[17px] stroke-[2.2]" />
              )}
            </span>
          </motion.button>
        )}

      <div className="sticky top-0 z-20 border-b border-white/10 p-4">
        <div
          className={`rounded-2xl p-3 transition-colors duration-150 ${
            isSidebarCollapsed ? 'border border-transparent bg-transparent' : 'border border-white/10 bg-white/[0.04]'
          }`}
        >
          <div className="flex items-center justify-center">
            <Logo size="default" showText={!isSidebarCollapsed} />
          </div>

          {!isSidebarCollapsed && selectedProperty && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-white/10 bg-black/10 p-3">
              <Home className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{selectedProperty.name}</p>
                <p className="truncate text-xs text-slate-300">{selectedProperty.address}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        <div className="space-y-1 pt-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.href);

            return (
              <div
                key={item.id}
                onMouseEnter={() => {
                  if (!isSidebarCollapsed) return;
                  setHoveredItem(item.id);
                  const buttonElement = buttonRefs.current[item.id];
                  if (buttonElement) {
                    const rect = buttonElement.getBoundingClientRect();
                    setTooltipPosition({ top: rect.top + window.scrollY + 2, left: rect.right + 8 });
                  }
                }}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <button
                  ref={(el) => (buttonRefs.current[item.id] = el)}
                  onClick={() => handleNavigation(item.href)}
                  className={`group flex w-full items-center rounded-xl border px-3 py-2.5 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${
                    isActive
                      ? 'border-cyan-300/35 bg-white/[0.12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]'
                      : 'border-transparent text-slate-200 hover:border-white/15 hover:bg-white/[0.10] hover:text-white active:bg-white/[0.14]'
                  } ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-sky-200' : 'text-slate-300 group-hover:text-white'}`} />

                  {!isSidebarCollapsed && (
                    <div className="ml-3 flex min-w-0 flex-1 items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
                            item.badge === 'new' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                          }`}
                        >
                          {item.badge === 'new' ? '!' : item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>

      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex justify-center">
          <button
            onClick={() => {
              dispatch(logoutUser());
              if (isMobile) onCloseMobile?.();
            }}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 text-slate-100 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
              isSidebarCollapsed ? 'h-10 w-10' : 'w-full px-3 py-2 text-sm font-medium'
            }`}
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {mounted && isSidebarCollapsed && hoveredItem &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="fixed rounded-lg border border-white/10 bg-slate-900/95 px-3 py-2 text-xs font-medium text-slate-100 shadow-xl"
              style={{ zIndex: 9999, top: tooltipPosition.top, left: tooltipPosition.left }}
            >
              {menuItems.find((item) => item.id === hoveredItem)?.label}
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
      </motion.aside>
    </>
  );
}

export function SidebarToggle() {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 lg:hidden"
      aria-label="Open sidebar"
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </motion.button>
  );
}
