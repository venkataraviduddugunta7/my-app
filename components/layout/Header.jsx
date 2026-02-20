'use client';

import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import propertyService from '@/services/propertyService';
import { 
  Search, 
  Bell, 
  RefreshCw,
  User, 
  Menu,
  X,
  ChevronDown,
  Zap,
  Shield,
  Activity,
  Building2,
  Check
} from 'lucide-react';
import { setSelectedProperty } from '@/store/slices/propertySlice';
import { addToast } from '@/store/slices/uiSlice';
import RealtimeIndicator from '@/components/ui/RealtimeIndicator';

export function Header({ onOpenSidebar }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPropertyMenu, setShowPropertyMenu] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  
  const notificationRef = useRef(null);
  const propertyMenuRef = useRef(null);
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useSelector((state) => state.auth);
  const { selectedProperty } = useSelector((state) => state.property);

  // Fetch properties when component mounts
  useEffect(() => {
    fetchProperties();
  }, []);

  // Listen for real-time property updates
  useEffect(() => {
    const handlePropertyUpdate = () => {
      fetchProperties(); // Refresh the properties list
    };

    // Listen for property updates from WebSocket
    if (typeof window !== 'undefined') {
      window.addEventListener('property-update', handlePropertyUpdate);
      return () => {
        window.removeEventListener('property-update', handlePropertyUpdate);
      };
    }
  }, []);

  // Close dropdowns when clicking outside and when pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (propertyMenuRef.current && !propertyMenuRef.current.contains(event.target)) {
        setShowPropertyMenu(false);
      }
    };

    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
        setShowPropertyMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeydown);
    };
  }, []);

  // Close any open menus when route changes
  useEffect(() => {
    setShowNotifications(false);
    setShowPropertyMenu(false);
  }, [pathname]);

  // Fetch properties from API
  const fetchProperties = async () => {
    try {
      setLoadingProperties(true);
      const response = await propertyService.getProperties();
      if (response.success) {
        setProperties(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoadingProperties(false);
    }
  };

  const getUserInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
  };

  const handleHeaderRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    dispatch(addToast({
      title: 'Refreshed',
      description: 'Latest data loaded',
      variant: 'success'
    }));
    window.setTimeout(() => setIsRefreshing(false), 700);
  };

  // Mock notifications data
  const notifications = [
    {
      id: 1,
      title: 'New Tenant Registration',
      message: 'John Doe has completed registration for Room 201',
      time: '2 min ago',
      type: 'success',
      unread: true
    },
    {
      id: 2,
      title: 'Payment Received',
      message: 'Monthly rent payment received from Room 105',
      time: '15 min ago',
      type: 'success',
      unread: true
    },
    {
      id: 3,
      title: 'Maintenance Request',
      message: 'AC repair requested for Room 304',
      time: '1 hour ago',
      type: 'warning',
      unread: false
    }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full border-b border-white/10 bg-[radial-gradient(circle_at_-40%_-240%,rgba(56,189,248,0.16),rgba(15,23,42,0.90)_35%,rgba(2,6,23,0.96)_100%)] backdrop-blur-2xl shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]"
    >
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left Section - Logo & Search */}
        <div className="flex items-center">
          {/* Mobile Menu Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenSidebar}
            className="rounded-xl border border-white/10 p-2 text-slate-200 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </motion.button>

          <div className="flex items-center gap-6">
            {/* Property Selector */}
            <div className="relative" ref={propertyMenuRef}>
              <motion.button
                onClick={() => setShowPropertyMenu(!showPropertyMenu)}
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-3 py-2 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] transition-all duration-200 hover:border-white/25 hover:bg-white/[0.11]"
                aria-expanded={showPropertyMenu}
                aria-haspopup="menu"
              >
                <Building2 className="h-4 w-4 text-cyan-200" />
                <span className="hidden max-w-[150px] truncate text-sm font-medium text-white sm:block">
                  {selectedProperty?.name || 'Select Property'}
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-200 transition-transform duration-200 ${showPropertyMenu ? 'rotate-180' : ''}`} />
              </motion.button>

              <AnimatePresence>
                {showPropertyMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute left-0 top-full z-[60] mt-2 w-64 overflow-hidden rounded-xl border border-white/15 bg-slate-950/95 shadow-2xl backdrop-blur-xl"
                  >
                    <div className="p-2">
                      <button
                        onClick={() => {
                          router.push('/properties');
                          setShowPropertyMenu(false);
                        }}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-cyan-100 transition-colors hover:bg-white/[0.08]"
                      >
                        + Manage Properties
                      </button>
                    </div>
                    <div className="border-t border-white/10">
                      <div className="max-h-64 overflow-y-auto p-2">
                        {loadingProperties ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-cyan-300"></div>
                            <span className="ml-2 text-sm text-slate-200">Loading properties...</span>
                          </div>
                        ) : properties.length > 0 ? (
                          properties.map((property) => {
                            const totalBeds = property.totalBeds || 0;
                            const occupiedBeds = property.occupiedBeds || 0;
                            
                            return (
                              <button
                                key={property.id}
                                onClick={() => {
                                  dispatch(setSelectedProperty(property));
                                  dispatch(addToast({
                                    title: 'Property Switched',
                                    description: `Now viewing ${property.name}`,
                                    variant: 'success'
                                  }));
                                  setShowPropertyMenu(false);
                                }}
                                className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                                  selectedProperty?.id === property.id
                                    ? 'bg-white/[0.10] text-white'
                                    : 'text-slate-100 hover:bg-white/[0.06]'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-white">{property.name}</p>
                                    <p className="text-xs text-slate-300">
                                      {occupiedBeds}/{totalBeds} beds occupied
                                    </p>
                                  </div>
                                  {selectedProperty?.id === property.id && (
                                    <Check className="h-4 w-4 text-cyan-300" />
                                  )}
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="text-center py-4">
                            <Building2 className="mx-auto mb-2 h-8 w-8 text-slate-500" />
                            <p className="text-sm text-slate-300">No properties found</p>
                            <button
                              onClick={() => {
                                router.push('/properties');
                                setShowPropertyMenu(false);
                              }}
                              className="mt-1 text-xs text-cyan-100 hover:text-cyan-50"
                            >
                              Add your first property
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Enhanced Search Bar */}
            <motion.div 
              className="relative hidden md:block"
              animate={{ 
                width: isSearchFocused ? 320 : 320,
                scale: isSearchFocused ? 1 : 1
              }}
              transition={{ duration: 0.2 }}
            >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors duration-200" />
              <input
                type="text"
                placeholder="Search tenants, rooms, payments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={`
                  w-full pl-10 pr-4 py-2.5 text-sm
                  rounded-xl border border-white/15 bg-white/[0.07]
                  text-white placeholder:text-slate-300 transition-all duration-200
                  focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-300/20
                  ${isSearchFocused ? 'shadow-[0_0_0_1px_rgba(125,211,252,0.24)]' : 'hover:bg-white/[0.1]'}
                `}
                aria-label="Global search"
              />
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              )}
            </div>
            
            {/* Search Results Dropdown */}
            <AnimatePresence>
              {searchQuery && isSearchFocused && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full z-[60] mt-2 w-full rounded-xl border border-white/15 bg-slate-950/95 shadow-2xl backdrop-blur-xl"
                >
                  <div className="p-3">
                    <p className="mb-2 text-xs text-slate-300">Quick Results</p>
                    <div className="space-y-1">
                      <div className="flex cursor-pointer items-center space-x-3 rounded-lg p-2 hover:bg-white/[0.07]">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-white">John Doe - Room 201</span>
                      </div>
                      <div className="flex cursor-pointer items-center space-x-3 rounded-lg p-2 hover:bg-white/[0.07]">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-white">Sarah Wilson - Room 105</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          </div>
        </div>

        {/* Right Section - Actions & Profile */}
        <div className="flex items-center space-x-3">
          {/* Real-time Status Indicator */}
          <RealtimeIndicator  />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleHeaderRefresh}
            className="rounded-xl border border-white/10 p-2 text-slate-200 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            aria-label="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </motion.button>
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-xl border border-white/10 p-2 text-slate-200 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
              aria-expanded={showNotifications}
              aria-haspopup="menu"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-error-500 text-xs font-semibold text-white shadow-lg"
                >
                  {unreadCount}
                </motion.span>
              )}
            </motion.button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 z-[60] mt-2 w-80 rounded-xl border border-white/15 bg-slate-950/95 shadow-2xl backdrop-blur-xl"
                >
                  <div className="border-b border-white/10 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white">Notifications</h3>
                      <span className="text-xs text-slate-300">{unreadCount} new</span>
                    </div>
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`cursor-pointer border-b border-white/5 p-4 transition-colors hover:bg-white/[0.05] ${
                          notification.unread ? 'bg-cyan-500/10' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`
                            flex h-8 w-8 items-center justify-center rounded-lg
                            ${notification.type === 'success' ? 'bg-emerald-500/20 text-emerald-200' : ''}
                            ${notification.type === 'warning' ? 'bg-amber-500/20 text-amber-200' : ''}
                            ${notification.type === 'error' ? 'bg-rose-500/20 text-rose-200' : ''}
                          `}>
                            {notification.type === 'success' && <Zap className="h-4 w-4" />}
                            {notification.type === 'warning' && <Shield className="h-4 w-4" />}
                            {notification.type === 'error' && <Activity className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">
                              {notification.title}
                            </p>
                            <p className="mt-1 text-sm text-slate-200">
                              {notification.message}
                            </p>
                            <p className="mt-2 text-xs text-slate-400">
                              {notification.time}
                            </p>
                          </div>
                          {notification.unread && (
                            <div className="h-2 w-2 rounded-full bg-cyan-300"></div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="border-t border-white/10 p-3">
                    <button className="w-full text-center text-sm font-medium text-cyan-100 hover:text-cyan-50">
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-3 px-1 py-1">
            <div className="hidden text-right sm:block">
              <p className="max-w-[180px] truncate text-sm font-semibold text-white">{user?.fullName || 'User'}</p>
              <p className="max-w-[180px] truncate text-xs text-slate-200/90">{user?.email || 'No email'}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/20 text-sm font-semibold text-white">
              {getUserInitials(user?.fullName)}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <AnimatePresence>
        {isSearchFocused && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/10 bg-slate-950/65 p-4 md:hidden"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-white/[0.08] py-2 pl-10 pr-4 text-white placeholder:text-slate-300 focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-300/20"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
} 
