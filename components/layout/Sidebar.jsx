'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
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
  ChevronLeft,
  ChevronRight,
  Zap,
  Shield,
  Activity,
  Calendar,
  PieChart,
  TrendingUp,
  UserCheck,
  Wallet,
  ClipboardList,
  MessageSquare
} from 'lucide-react';
import { Logo } from '@/components/ui';

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/',
    badge: null,
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'properties',
    label: 'Properties',
    icon: Building2,
    href: '/properties',
    badge: null,
    color: 'from-indigo-500 to-indigo-600'
  },
  {
    id: 'tenants',
    label: 'Tenants',
    icon: Users,
    href: '/tenants',
    badge: 'new',
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 'rooms',
    label: 'Rooms & Beds',
    icon: Bed,
    href: '/rooms',
    badge: null,
    color: 'from-orange-500 to-orange-600'
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: CreditCard,
    href: '/payments',
    badge: '5',
    color: 'from-green-500 to-green-600'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    href: '/analytics',
    badge: null,
    color: 'from-indigo-500 to-indigo-600'
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: PieChart,
    href: '/reports',
    badge: null,
    color: 'from-pink-500 to-pink-600'
  },
  {
    id: 'notices',
    label: 'Notices',
    icon: Bell,
    href: '/notices',
    badge: null,
    color: 'from-yellow-500 to-yellow-600'
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: FileText,
    href: '/documents',
    badge: null,
    color: 'from-teal-500 to-teal-600'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/settings',
    badge: null,
    color: 'from-gray-500 to-gray-600'
  }
];

const quickActions = [
  {
    id: 'add-tenant',
    label: 'Add Tenant',
    icon: UserCheck,
    action: () => console.log('Add tenant'),
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'collect-payment',
    label: 'Collect Payment',
    icon: Wallet,
    action: () => console.log('Collect payment'),
    color: 'from-green-500 to-green-600'
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    icon: ClipboardList,
    action: () => console.log('Maintenance'),
    color: 'from-orange-500 to-orange-600'
  }
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const buttonRefs = useRef({});
  const pathname = usePathname();
  const router = useRouter();
  const { selectedProperty } = useSelector((state) => state.property);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isActiveRoute = (href) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const handleNavigation = (href) => {
    router.push(href);
  };

  const sidebarVariants = {
    expanded: { width: 280 },
    collapsed: { width: 80 }
  };

  const itemVariants = {
    expanded: { opacity: 1, x: 0 },
    collapsed: { opacity: 0, x: -10 }
  };

  return (
    <motion.aside
      initial="expanded"
      animate={isCollapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative z-40 flex h-screen flex-col border-r-2 border-gray-200 bg-white shadow-xl overflow-y-auto"
    >
      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white shadow-elegant text-gray-500 hover:text-gray-700 transition-colors"
        style={{ zIndex: 30 }}
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </motion.button>

      {/* Header Section - Sticky */}
      <div className="sticky top-0 z-10 p-6 flex-shrink-0 bg-white border-b border-gray-200 shadow-sm">
        <motion.div 
          className="flex items-center min-w-0"
          animate={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
        >
          <Logo 
            size={isCollapsed ? 'default' : 'default'} 
            showText={!isCollapsed}
            className={isCollapsed ? 'justify-center' : ''}
          />
        </motion.div>

        {/* Property Selector */}
        <AnimatePresence>
          {!isCollapsed && selectedProperty && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-3 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl border border-primary-100 min-w-0"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <Home className="h-4 w-4 text-primary-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {selectedProperty.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {selectedProperty.address}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 pb-4 pt-2">
        {/* Main Navigation Section */}
        <div className="space-y-2 mb-6">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.href);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onMouseEnter={() => {
                  if (isCollapsed) {
                    setHoveredItem(item.id);
                    const buttonElement = buttonRefs.current[item.id];
                    if (buttonElement) {
                      const rect = buttonElement.getBoundingClientRect();
                      setTooltipPosition({
                        top: rect.top + window.scrollY,
                        left: rect.right + 8
                      });
                    }
                  }
                }}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <motion.button
                  ref={(el) => (buttonRefs.current[item.id] = el)}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNavigation(item.href)}
                  className={`
                    relative w-full flex items-center rounded-lg px-3 py-3 text-left transition-all duration-300 group
                    ${isActive 
                      ? 'bg-primary-500 text-white shadow-md' 
                      : 'text-gray-700 hover:bg-gray-100/70 hover:text-gray-900'
                    }
                    ${isCollapsed ? 'justify-center' : 'justify-start'}
                  `}
                >
                  {/* Icon */}
                  <div className="relative">
                    <Icon className={`h-5 w-5 transition-colors duration-200 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-primary-500'}`} />
                    
                    
                    {/* Hover indicator */}
                    {!isActive && (
                      <motion.div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-primary-500 rounded-r-full opacity-0 group-hover:opacity-100 group-hover:h-6 transition-all duration-200"
                        initial={{ height: 0, opacity: 0 }}
                        whileHover={{ height: 24, opacity: 1 }}
                      />
                    )}
                    
                  </div>

                  {/* Label and Badge */}
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div
                        variants={itemVariants}
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                        className="ml-3 flex items-center justify-between flex-1 min-w-0"
                      >
                        <span className="font-medium truncate">{item.label}</span>
                        
                        {/* Badge */}
                        {item.badge && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={`
                              ml-2 flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold
                              ${item.badge === 'new' 
                                ? 'bg-success-500 text-white' 
                                : 'bg-warning-500 text-white'
                              }
                            `}
                          >
                            {item.badge === 'new' ? '!' : item.badge}
                          </motion.span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                </motion.button>
              </motion.div>
            );
          })}
        </div>

        {/* Divider */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ opacity: 0, scaleX: 0 }}
              className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-6"
            />
          )}
        </AnimatePresence>

        {/* Quick Actions Section */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200/50 p-4 shadow-sm"
            >
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3 flex items-center">
                <Zap className="h-3 w-3 mr-2 text-primary-500" />
                Quick Actions
              </h3>
              
              <div className="space-y-2">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  
                  return (
                    <motion.button
                      key={action.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={action.action}
                      className="w-full flex items-center space-x-3 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200 group"
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${action.color} text-white shadow-sm`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{action.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Summary */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-8 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl"
            >
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Today's Overview</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-success-500" />
                    <span className="text-sm text-gray-600">Occupancy</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">87%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Wallet className="h-4 w-4 text-primary-500" />
                    <span className="text-sm text-gray-600">Revenue</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">₹12.5k</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-warning-500" />
                    <span className="text-sm text-gray-600">Pending</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">3</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4 bg-white shadow-lg">
        <AnimatePresence>
          {!isCollapsed ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center p-3 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg border border-primary-100"
            >
              <p className="text-xs text-gray-600 font-semibold flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                MY PG v2.0
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Management System
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tooltip Portal - Outside sidebar to prevent overflow */}
      {mounted && isCollapsed && hoveredItem && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed px-4 py-2.5 bg-gray-800 text-white text-sm font-medium rounded-xl shadow-2xl whitespace-nowrap pointer-events-none border border-gray-700"
            style={{
              zIndex: 9999,
              top: tooltipPosition.top,
              left: tooltipPosition.left,
              backdropFilter: 'blur(8px)',
              background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.95), rgba(17, 24, 39, 0.95))'
            }}
          >
            {menuItems.find(item => item.id === hoveredItem)?.label}
            
            
            {/* Subtle glow effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/10 to-secondary-500/10 -z-10" />
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </motion.aside>
  );
}

// Export the toggle component for mobile use
export function SidebarToggle() {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 lg:hidden"
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </motion.button>
  );
}