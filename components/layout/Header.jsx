'use client';

import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Bell, 
  Settings, 
  LogOut, 
  User, 
  Moon, 
  Sun,
  Menu,
  X,
  ChevronDown,
  Zap,
  Shield,
  Activity
} from 'lucide-react';
import { logoutUser } from '@/store/slices/authSlice';
import RealtimeIndicator from '@/components/ui/RealtimeIndicator';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const profileMenuRef = useRef(null);
  const notificationRef = useRef(null);
  const dispatch = useDispatch();
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const { selectedProperty } = useSelector((state) => state.property);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logoutUser());
    setShowProfileMenu(false);
  };

  const handleSettingsClick = () => {
    router.push('/settings');
    setShowProfileMenu(false);
  };

  const getUserInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
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
      className="sticky top-0 z-50 w-full border-b border-gray-200/50 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60"
    >
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left Section - Logo & Search */}
        <div className="flex items-center space-x-6">
          {/* Mobile Menu Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
          >
            <Menu className="h-5 w-5" />
          </motion.button>

          {/* Logo & Property Info */}
          <div className="flex items-center space-x-4">
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-glow-sm">
                <Activity className="h-4 w-4" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-gray-900 gradient-text">
                  PG Manager Pro
                </h1>
                {selectedProperty && (
                  <p className="text-xs text-gray-500 -mt-1">
                    {selectedProperty.name}
                  </p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Enhanced Search Bar */}
          <motion.div 
            className="relative hidden md:block"
            animate={{ 
              width: isSearchFocused ? 400 : 320,
              scale: isSearchFocused ? 1.02 : 1
            }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors duration-200" />
              <input
                type="text"
                placeholder="Search tenants, rooms, payments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={`
                  w-full pl-10 pr-4 py-2.5 text-sm
                  bg-gray-50 border border-gray-200 rounded-xl
                  focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                  placeholder:text-gray-500 transition-all duration-200
                  ${isSearchFocused ? 'shadow-elegant' : 'hover:bg-gray-100'}
                `}
              />
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                  className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-float-lg z-50"
                >
                  <div className="p-3">
                    <p className="text-xs text-gray-500 mb-2">Quick Results</p>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">John Doe - Room 201</span>
                      </div>
                      <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">Sarah Wilson - Room 105</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Right Section - Actions & Profile */}
        <div className="flex items-center space-x-3">
          {/* Real-time Status Indicator */}
          <RealtimeIndicator />

          {/* Dark Mode Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleDarkMode}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </motion.button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
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
                  className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-float-lg z-50"
                >
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                      <span className="text-xs text-gray-500">{unreadCount} new</span>
                    </div>
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                          notification.unread ? 'bg-primary-50/30' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`
                            flex h-8 w-8 items-center justify-center rounded-lg
                            ${notification.type === 'success' ? 'bg-success-100 text-success-600' : ''}
                            ${notification.type === 'warning' ? 'bg-warning-100 text-warning-600' : ''}
                            ${notification.type === 'error' ? 'bg-error-100 text-error-600' : ''}
                          `}>
                            {notification.type === 'success' && <Zap className="h-4 w-4" />}
                            {notification.type === 'warning' && <Shield className="h-4 w-4" />}
                            {notification.type === 'error' && <Activity className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {notification.time}
                            </p>
                          </div>
                          {notification.unread && (
                            <div className="h-2 w-2 rounded-full bg-primary-500"></div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="p-3 border-t border-gray-100">
                    <button className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium">
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Menu */}
          <div className="relative" ref={profileMenuRef}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-3 rounded-lg p-2 hover:bg-gray-100 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-gray-900">{user?.fullName || 'User'}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase() || 'Member'}</p>
                </div>
                
                <div className="relative">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white font-semibold text-sm shadow-elegant">
                    {getUserInitials(user?.fullName)}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success-500 border-2 border-white"></div>
                </div>
                
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                  showProfileMenu ? 'rotate-180' : ''
                }`} />
              </div>
            </motion.button>

            {/* Profile Dropdown */}
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-float-lg z-50"
                >
                  {/* Profile Header */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white font-semibold">
                        {getUserInitials(user?.fullName)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{user?.fullName || 'User'}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 mt-1">
                          {user?.role || 'Member'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="p-2">
                    <motion.button
                      whileHover={{ x: 4 }}
                      onClick={handleSettingsClick}
                      className="flex w-full items-center space-x-3 rounded-lg p-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200"
                    >
                      <Settings className="h-4 w-4 text-gray-500" />
                      <span>Settings & Preferences</span>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ x: 4 }}
                      onClick={() => router.push('/profile')}
                      className="flex w-full items-center space-x-3 rounded-lg p-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200"
                    >
                      <User className="h-4 w-4 text-gray-500" />
                      <span>View Profile</span>
                    </motion.button>
                  </div>
                  
                  <div className="border-t border-gray-100 p-2">
                    <motion.button
                      whileHover={{ x: 4 }}
                      onClick={handleLogout}
                      className="flex w-full items-center space-x-3 rounded-lg p-3 text-left text-sm text-error-700 hover:bg-error-50 transition-all duration-200"
                    >
                      <LogOut className="h-4 w-4 text-error-500" />
                      <span>Sign Out</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
            className="md:hidden border-t border-gray-200 bg-gray-50 p-4"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}