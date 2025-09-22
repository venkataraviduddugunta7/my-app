'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
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
  const pathname = usePathname();
  const router = useRouter();
  const { selectedProperty } = useSelector((state) => state.property);

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
      className="relative z-40 flex h-screen flex-col border-r border-gray-200/50 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 overflow-y-auto"
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
      <div className="sticky top-0 z-10 p-6 flex-shrink-0 bg-white border-b border-gray-200/50">
        <motion.div 
          className="flex items-center space-x-3 min-w-0"
          animate={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-glow-sm flex-shrink-0">
            <Activity className="h-5 w-5" />
          </div>
          
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="min-w-0 flex-1"
              >
                <h1 className="text-xl font-bold gradient-text truncate">PG Manager</h1>
                <p className="text-xs text-gray-500 -mt-1 truncate">Professional Edition</p>
              </motion.div>
            )}
          </AnimatePresence>
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
      <nav className="flex-1 px-4 pb-4">
        <div className="space-y-1">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.href);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNavigation(item.href)}
                  className={`
                    relative w-full flex items-center rounded-xl px-3 py-3 text-left transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-glow-sm' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                    ${isCollapsed ? 'justify-center' : 'justify-start'}
                  `}
                >
                  {/* Icon */}
                  <div className="relative">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    
                    {/* Active indicator dot */}
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-white shadow-sm"
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

                  {/* Tooltip for collapsed state */}
                  <AnimatePresence>
                    {isCollapsed && hoveredItem === item.id && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg shadow-lg whitespace-nowrap"
                        style={{ zIndex: 20 }}
                      >
                        {item.label}
                        <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Actions Section */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-8"
            >
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
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
                      className="w-full flex items-center space-x-3 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
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
      <div className="border-t border-gray-200 p-4">
        <AnimatePresence>
          {!isCollapsed ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <p className="text-xs text-gray-500">
                PG Manager Pro v2.0
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Enterprise Edition
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