'use client';

import { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import propertyService from '@/services/propertyService';
import apiService from '@/services/api';
import {
  Bell,
  Building2,
  Check,
  CheckCheck,
  ChevronDown,
  CircleAlert,
  CircleCheckBig,
  CircleX,
  Info,
  Menu,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { setSelectedProperty } from '@/store/slices/propertySlice';
import { addToast } from '@/store/slices/uiSlice';
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/store/slices/notificationsSlice';

const formatRelativeTime = (value) => {
  if (!value) return 'Just now';

  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return 'Just now';

  const diffMs = Date.now() - timestamp.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

const getNotificationIcon = (type) => {
  switch (String(type || '').toLowerCase()) {
    case 'success':
      return CircleCheckBig;
    case 'warning':
      return CircleAlert;
    case 'error':
      return CircleX;
    default:
      return Info;
  }
};

const getNotificationStyles = (type) => {
  switch (String(type || '').toLowerCase()) {
    case 'success':
      return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100';
    case 'warning':
      return 'border-amber-400/20 bg-amber-500/10 text-amber-100';
    case 'error':
      return 'border-rose-400/20 bg-rose-500/10 text-rose-100';
    default:
      return 'border-sky-400/20 bg-sky-500/10 text-sky-100';
  }
};

export function Header({ onOpenSidebar }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPropertyMenu, setShowPropertyMenu] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  const notificationRef = useRef(null);
  const propertyMenuRef = useRef(null);
  const searchRef = useRef(null);
  const searchRequestId = useRef(0);

  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useSelector((state) => state.auth);
  const { selectedProperty } = useSelector((state) => state.property);
  const { items: notifications, unreadCount, loading: notificationsLoading } = useSelector(
    (state) => state.notifications
  );

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    const handlePropertyUpdate = () => {
      fetchProperties();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('property-update', handlePropertyUpdate);
      return () => {
        window.removeEventListener('property-update', handlePropertyUpdate);
      };
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }

      if (propertyMenuRef.current && !propertyMenuRef.current.contains(event.target)) {
        setShowPropertyMenu(false);
      }

      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
        setShowPropertyMenu(false);
        setShowSearchResults(false);
        setShowMobileSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeydown);
    };
  }, []);

  useEffect(() => {
    setShowNotifications(false);
    setShowPropertyMenu(false);
    setShowSearchResults(false);
    setShowMobileSearch(false);
  }, [pathname]);

  useEffect(() => {
    dispatch(fetchNotifications({ propertyId: selectedProperty?.id, limit: 12 }));
    dispatch(fetchUnreadNotificationCount({ propertyId: selectedProperty?.id }));
  }, [dispatch, selectedProperty?.id]);

  useEffect(() => {
    const normalizedQuery = searchQuery.trim();
    const shouldSearch = normalizedQuery.length >= 2 && selectedProperty?.id;

    if (!shouldSearch) {
      setSearchLoading(false);
      setSearchResults([]);
      return;
    }

    const requestId = searchRequestId.current + 1;
    searchRequestId.current = requestId;
    setSearchLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const response = await apiService.tenants.searchByName(selectedProperty.id, normalizedQuery, 6);

        if (searchRequestId.current !== requestId) {
          return;
        }

        setSearchResults(response.data || []);
      } catch (error) {
        if (searchRequestId.current === requestId) {
          setSearchResults([]);
        }
      } finally {
        if (searchRequestId.current === requestId) {
          setSearchLoading(false);
        }
      }
    }, 280);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchQuery, selectedProperty?.id]);

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

  const getUserInitials = (name) =>
    name
      ? name
          .split(' ')
          .map((part) => part[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'U';

  const handleHeaderRefresh = async () => {
    setIsRefreshing(true);
    router.refresh();
    await Promise.allSettled([
      fetchProperties(),
      dispatch(fetchNotifications({ propertyId: selectedProperty?.id, limit: 12 })),
      dispatch(fetchUnreadNotificationCount({ propertyId: selectedProperty?.id })),
    ]);
    dispatch(
      addToast({
        title: 'Quick refresh complete',
        description: 'Properties and notifications were refreshed.',
        variant: 'success',
      })
    );
    window.setTimeout(() => setIsRefreshing(false), 700);
  };

  const handleSearchSelect = (tenant) => {
    const encodedName = encodeURIComponent(tenant.fullName);
    const nextUrl = `/tenants?search=${encodedName}`;
    setSearchQuery(tenant.fullName);
    setShowSearchResults(false);
    setShowMobileSearch(false);

    if (typeof window !== 'undefined') {
      window.location.assign(nextUrl);
      return;
    }

    router.push(nextUrl);
  };

  const handleNotificationOpen = async () => {
    const nextValue = !showNotifications;
    setShowNotifications(nextValue);

    if (nextValue) {
      await Promise.allSettled([
        dispatch(fetchNotifications({ propertyId: selectedProperty?.id, limit: 12 })),
        dispatch(fetchUnreadNotificationCount({ propertyId: selectedProperty?.id })),
      ]);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await dispatch(markNotificationRead(notification.id));
    }

    setShowNotifications(false);

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const handleMarkAllRead = async () => {
    await dispatch(markAllNotificationsRead({ propertyId: selectedProperty?.id || null }));
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.42, ease: 'easeOut' }}
      className="w-full border-b border-white/10 bg-[radial-gradient(circle_at_-15%_-220%,rgba(56,189,248,0.14),rgba(15,23,42,0.92)_38%,rgba(2,6,23,0.98)_100%)] backdrop-blur-2xl shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]"
    >
      <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-5">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenSidebar}
            className="rounded-xl border border-white/10 p-2 text-slate-200 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white lg:hidden"
            aria-label="Open sidebar"
            type="button"
          >
            <Menu className="h-5 w-5" />
          </motion.button>

          <div className="relative" ref={propertyMenuRef}>
            <motion.button
              type="button"
              onClick={() => setShowPropertyMenu((value) => !value)}
              className="flex h-10 items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.07] px-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] transition-all duration-200 hover:border-white/25 hover:bg-white/[0.11]"
              aria-expanded={showPropertyMenu}
              aria-haspopup="menu"
            >
              <Building2 className="h-4 w-4 text-cyan-200" />
              <span className="hidden max-w-[168px] truncate text-left text-sm font-medium text-white sm:block">
                {selectedProperty?.name || 'Select Property'}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-slate-200 transition-transform duration-200 ${
                  showPropertyMenu ? 'rotate-180' : ''
                }`}
              />
            </motion.button>

            <AnimatePresence>
              {showPropertyMenu ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 top-full z-[60] mt-2 w-72 overflow-hidden rounded-2xl border border-white/15 bg-slate-950/95 shadow-2xl backdrop-blur-xl"
                >
                  <div className="border-b border-white/10 p-3">
                    <button
                      type="button"
                      onClick={() => {
                        router.push('/properties');
                        setShowPropertyMenu(false);
                      }}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-left text-sm font-medium text-slate-100 transition-colors hover:bg-white/[0.10]"
                    >
                      Manage properties
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto p-2">
                    {loadingProperties ? (
                      <div className="flex items-center justify-center py-6 text-sm text-slate-300">
                        Loading properties...
                      </div>
                    ) : properties.length ? (
                      properties.map((property) => {
                        const totalBeds = property.totalBeds || 0;
                        const occupiedBeds = property.occupiedBeds || 0;

                        return (
                          <button
                            key={property.id}
                            type="button"
                            onClick={() => {
                              dispatch(setSelectedProperty(property));
                              setShowPropertyMenu(false);
                              dispatch(
                                addToast({
                                  title: 'Property switched',
                                  description: `Now viewing ${property.name}.`,
                                  variant: 'success',
                                })
                              );
                            }}
                            className={`mb-1 w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                              selectedProperty?.id === property.id
                                ? 'border-cyan-300/35 bg-white/[0.10] text-white'
                                : 'border-transparent text-slate-100 hover:border-white/10 hover:bg-white/[0.06]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-white">{property.name}</p>
                                <p className="truncate text-xs text-slate-300">
                                  {property.city || property.address}
                                </p>
                                <p className="mt-1 text-[11px] text-slate-400">
                                  {occupiedBeds}/{totalBeds} beds occupied
                                </p>
                              </div>
                              {selectedProperty?.id === property.id ? (
                                <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                              ) : null}
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-3 py-6 text-center">
                        <Building2 className="mx-auto mb-2 h-8 w-8 text-slate-500" />
                        <p className="text-sm text-slate-300">No properties found</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="relative hidden min-w-0 flex-1 md:block" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                placeholder="Search tenants by name"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                name="tenant-global-search"
                className="h-10 w-full rounded-2xl border border-white/15 bg-white/[0.07] pl-10 pr-10 text-sm text-white placeholder:text-slate-300 transition-all duration-200 focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-300/20"
                aria-label="Search tenants by name"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowSearchResults(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 transition-colors hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <AnimatePresence>
              {showSearchResults && searchQuery.trim() ? (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full z-[60] mt-2 w-full overflow-hidden rounded-2xl border border-white/15 bg-slate-950/95 shadow-2xl backdrop-blur-xl"
                >
                  <div className="border-b border-white/10 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
                      Tenant name search
                    </p>
                  </div>

                  <div className="max-h-80 overflow-y-auto p-2">
                    {!selectedProperty ? (
                      <div className="px-3 py-5 text-sm text-slate-300">
                        Select a property first to search its tenants.
                      </div>
                    ) : searchLoading ? (
                      <div className="px-3 py-5 text-sm text-slate-300">Searching tenants...</div>
                    ) : searchResults.length ? (
                      searchResults.map((tenant) => (
                        <button
                          key={tenant.id}
                          type="button"
                          onClick={() => handleSearchSelect(tenant)}
                          className="mb-1 w-full rounded-xl border border-transparent px-3 py-3 text-left transition-colors hover:border-white/10 hover:bg-white/[0.06]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-white">{tenant.fullName}</p>
                              <p className="truncate text-xs text-slate-300">
                                {tenant.bed?.room?.roomNumber
                                  ? `Room ${tenant.bed.room.roomNumber} • Bed ${tenant.bed.bedNumber}`
                                  : 'No bed assigned'}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full border border-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-200">
                              {tenant.status}
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-5 text-sm text-slate-300">
                        No tenants found for &quot;{searchQuery.trim()}&quot;.
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMobileSearch((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-200 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white md:hidden"
            aria-label="Toggle tenant search"
          >
            <Search className="h-4 w-4" />
          </button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleHeaderRefresh}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-200 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            aria-label="Refresh data"
            type="button"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </motion.button>

          <div className="relative" ref={notificationRef}>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleNotificationOpen}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-200 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
              aria-expanded={showNotifications}
              aria-haspopup="menu"
              type="button"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white shadow-lg">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
            </motion.button>

            <AnimatePresence>
              {showNotifications ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -10 }}
                  className="absolute right-0 z-[60] mt-2 w-[22rem] overflow-hidden rounded-2xl border border-white/15 bg-slate-950/95 shadow-2xl backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white">Realtime notifications</h3>
                      <p className="text-xs text-slate-400">
                        {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      disabled={!unreadCount}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-96 overflow-y-auto p-2">
                    {notificationsLoading ? (
                      <div className="px-3 py-6 text-sm text-slate-300">Loading notifications...</div>
                    ) : notifications.length ? (
                      notifications.map((notification) => {
                        const Icon = getNotificationIcon(notification.type);

                        return (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() => handleNotificationClick(notification)}
                            className={`mb-1 w-full rounded-xl border px-3 py-3 text-left transition-colors hover:bg-white/[0.06] ${
                              notification.isRead
                                ? 'border-transparent bg-transparent'
                                : 'border-white/10 bg-white/[0.05]'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${getNotificationStyles(
                                  notification.type
                                )}`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <p className="truncate text-sm font-medium text-white">
                                    {notification.title}
                                  </p>
                                  {!notification.isRead ? (
                                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-300" />
                                  ) : null}
                                </div>
                                <p className="mt-1 text-sm text-slate-300">{notification.message}</p>
                                <p className="mt-2 text-xs text-slate-400">
                                  {formatRelativeTime(notification.createdAt)}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-3 py-8 text-center">
                        <Bell className="mx-auto mb-2 h-8 w-8 text-slate-500" />
                        <p className="text-sm text-slate-300">No notifications yet</p>
                        <p className="mt-1 text-xs text-slate-400">
                          New tenant, payment, document, and notice activity will appear here.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="flex h-10 items-center gap-2 rounded-2xl bg-transparent px-0 shadow-none sm:gap-3 sm:bg-white/[0.05] sm:px-3 sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="hidden min-w-0 text-right sm:block">
              <p className="max-w-[180px] truncate text-sm font-semibold text-white">
                {user?.fullName || 'User'}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-sm font-semibold text-white sm:h-8 sm:w-8 sm:text-xs">
              {getUserInitials(user?.fullName)}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showMobileSearch ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/10 bg-slate-950/65 px-4 pb-4 pt-3 md:hidden"
          >
            <div className="relative" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                placeholder="Search tenants by name"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                name="tenant-global-search-mobile"
                className="h-10 w-full rounded-2xl border border-white/15 bg-white/[0.08] pl-10 pr-10 text-sm text-white placeholder:text-slate-300 focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-300/20"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowSearchResults(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            {showSearchResults && searchQuery.trim() ? (
              <div className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/90">
                {!selectedProperty ? (
                  <div className="px-3 py-4 text-sm text-slate-300">
                    Select a property first to search its tenants.
                  </div>
                ) : searchLoading ? (
                  <div className="px-3 py-4 text-sm text-slate-300">Searching tenants...</div>
                ) : searchResults.length ? (
                  searchResults.map((tenant) => (
                    <button
                      key={tenant.id}
                      type="button"
                      onClick={() => handleSearchSelect(tenant)}
                      className="block w-full border-b border-white/5 px-3 py-3 text-left last:border-b-0"
                    >
                      <p className="text-sm font-medium text-white">{tenant.fullName}</p>
                      <p className="text-xs text-slate-300">
                        {tenant.bed?.room?.roomNumber
                          ? `Room ${tenant.bed.room.roomNumber} • Bed ${tenant.bed.bedNumber}`
                          : 'No bed assigned'}
                      </p>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-4 text-sm text-slate-300">
                    No tenants found for &quot;{searchQuery.trim()}&quot;.
                  </div>
                )}
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}
