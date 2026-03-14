'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Drawer } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { fetchDashboardStats, fetchRecentActivities } from '@/store/slices/dashboardSlice';
import { fetchBeds } from '@/store/slices/bedsSlice';
import { fetchProperties } from '@/store/slices/propertySlice';
import {
  AlertCircle,
  Bed,
  Bell,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Loader2,
  Phone,
  RefreshCw,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';

const ACTIVITY_LIMIT = 30;
const FEED_PREVIEW_LIMIT = 6;
const BED_SPOTLIGHT_LIMIT = 6;

const formatRelativeTime = (value) => {
  if (!value) return 'Just now';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const ranges = [
    { limit: 60, value: 1, unit: 'second' },
    { limit: 3600, value: 60, unit: 'minute' },
    { limit: 86400, value: 3600, unit: 'hour' },
    { limit: 604800, value: 86400, unit: 'day' },
  ];

  for (const range of ranges) {
    if (Math.abs(diffSeconds) < range.limit) {
      return formatter.format(Math.round(diffSeconds / range.value), range.unit);
    }
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getDefaultActivityTitle = (category) => {
  switch (category) {
    case 'TENANT':
      return 'Tenant activity';
    case 'PAYMENT':
      return 'Payment activity';
    case 'NOTICE':
      return 'Notice activity';
    case 'DOCUMENT':
      return 'Document activity';
    case 'PROPERTY':
      return 'Property activity';
    case 'MAINTENANCE':
      return 'Maintenance activity';
    default:
      return 'System activity';
  }
};

const inferActivityCategory = (activity) => {
  const category = String(activity?.category || '').toUpperCase();
  if (category) return category;

  const type = String(activity?.type || '').toUpperCase();
  if (type.includes('TENANT')) return 'TENANT';
  if (type.includes('PAYMENT')) return 'PAYMENT';
  if (type.includes('NOTICE')) return 'NOTICE';
  if (type.includes('DOCUMENT')) return 'DOCUMENT';
  if (type.includes('MAINTENANCE')) return 'MAINTENANCE';
  if (type.includes('PROPERTY')) return 'PROPERTY';
  return 'SYSTEM';
};

const getActivityRoute = (category) => {
  switch (category) {
    case 'TENANT':
      return '/tenants';
    case 'PAYMENT':
      return '/payments';
    case 'NOTICE':
      return '/notices';
    case 'DOCUMENT':
      return '/documents';
    case 'PROPERTY':
      return '/properties';
    case 'MAINTENANCE':
      return '/rooms';
    default:
      return null;
  }
};

const normalizeActivity = (activity) => {
  const category = inferActivityCategory(activity);
  const title = activity?.title || getDefaultActivityTitle(category);
  const message = activity?.message || title;
  const timestamp = activity?.timestamp || activity?.createdAt || new Date().toISOString();
  const dedupeKey =
    activity?.id ||
    [activity?.entityType, activity?.entityId, category, message, timestamp].filter(Boolean).join(':');

  return {
    id: dedupeKey,
    title,
    message,
    category,
    timestamp,
    actionUrl: activity?.actionUrl || getActivityRoute(category),
    propertyName: activity?.propertyName || null,
  };
};

const getActivityStyles = (category) => {
  switch (category) {
    case 'TENANT':
      return {
        icon: Users,
        badge: 'Tenant',
        iconClass: 'border-emerald-200/80 bg-emerald-100/70 text-emerald-700',
        badgeClass: 'border-emerald-200/80 bg-emerald-50 text-emerald-700',
      };
    case 'PAYMENT':
      return {
        icon: CreditCard,
        badge: 'Payment',
        iconClass: 'border-sky-200/80 bg-sky-100/70 text-sky-700',
        badgeClass: 'border-sky-200/80 bg-sky-50 text-sky-700',
      };
    case 'NOTICE':
      return {
        icon: Bell,
        badge: 'Notice',
        iconClass: 'border-violet-200/80 bg-violet-100/70 text-violet-700',
        badgeClass: 'border-violet-200/80 bg-violet-50 text-violet-700',
      };
    case 'DOCUMENT':
      return {
        icon: FileText,
        badge: 'Document',
        iconClass: 'border-amber-200/80 bg-amber-100/70 text-amber-700',
        badgeClass: 'border-amber-200/80 bg-amber-50 text-amber-700',
      };
    case 'MAINTENANCE':
      return {
        icon: Wrench,
        badge: 'Maintenance',
        iconClass: 'border-rose-200/80 bg-rose-100/70 text-rose-700',
        badgeClass: 'border-rose-200/80 bg-rose-50 text-rose-700',
      };
    default:
      return {
        icon: Clock,
        badge: 'System',
        iconClass: 'border-slate-200/80 bg-slate-100/80 text-slate-700',
        badgeClass: 'border-slate-200/80 bg-slate-50 text-slate-700',
      };
  }
};

function DashboardMetricCard({ title, value, subtitle, icon: Icon, accent }) {
  const accents = {
    blue: {
      icon: 'border-sky-200/80 bg-sky-100/80 text-sky-700',
      glow: 'from-sky-200/70 via-sky-100/20 to-transparent',
    },
    emerald: {
      icon: 'border-emerald-200/80 bg-emerald-100/80 text-emerald-700',
      glow: 'from-emerald-200/70 via-emerald-100/20 to-transparent',
    },
    amber: {
      icon: 'border-amber-200/80 bg-amber-100/80 text-amber-700',
      glow: 'from-amber-200/70 via-amber-100/20 to-transparent',
    },
    violet: {
      icon: 'border-violet-200/80 bg-violet-100/80 text-violet-700',
      glow: 'from-violet-200/70 via-violet-100/20 to-transparent',
    },
  };

  const palette = accents[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-[1.9rem] border border-white/60 bg-white/88 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl"
    >
      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${palette.glow}`} />
      <div className="absolute inset-x-5 top-0 h-px bg-white/70" />
      <div className="flex items-start justify-between gap-4">
        <div className="relative space-y-2">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{value}</p>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className={`relative flex h-12 w-12 items-center justify-center rounded-2xl border ${palette.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}

const getToneStyles = (tone = 'slate') => {
  const tones = {
    sky: {
      icon: 'border-sky-200/80 bg-sky-100/80 text-sky-700',
      panel: 'border-sky-200/80 bg-[linear-gradient(180deg,rgba(240,249,255,0.95),rgba(255,255,255,0.92))]',
      surface: 'hover:border-sky-200/80 hover:bg-sky-50/50',
    },
    emerald: {
      icon: 'border-emerald-200/80 bg-emerald-100/80 text-emerald-700',
      panel: 'border-emerald-200/80 bg-[linear-gradient(180deg,rgba(236,253,245,0.95),rgba(255,255,255,0.92))]',
      surface: 'hover:border-emerald-200/80 hover:bg-emerald-50/50',
    },
    violet: {
      icon: 'border-violet-200/80 bg-violet-100/80 text-violet-700',
      panel: 'border-violet-200/80 bg-[linear-gradient(180deg,rgba(245,243,255,0.95),rgba(255,255,255,0.92))]',
      surface: 'hover:border-violet-200/80 hover:bg-violet-50/50',
    },
    amber: {
      icon: 'border-amber-200/80 bg-amber-100/80 text-amber-700',
      panel: 'border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,251,235,0.96),rgba(255,255,255,0.92))]',
      surface: 'hover:border-amber-200/80 hover:bg-amber-50/50',
    },
    rose: {
      icon: 'border-rose-200/80 bg-rose-100/80 text-rose-700',
      panel: 'border-rose-200/80 bg-[linear-gradient(180deg,rgba(255,241,242,0.96),rgba(255,255,255,0.92))]',
      surface: 'hover:border-rose-200/80 hover:bg-rose-50/50',
    },
    slate: {
      icon: 'border-slate-200/80 bg-slate-100/80 text-slate-700',
      panel: 'border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,0.92))]',
      surface: 'hover:border-slate-300 hover:bg-white',
    },
  };

  return tones[tone] || tones.slate;
};

function QuickActionTile({ icon: Icon, label, onClick, tone = 'slate' }) {
  const styles = getToneStyles(tone);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/82 px-4 py-3 text-left transition-all duration-200 ${styles.surface}`}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${styles.icon}`}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="truncate text-sm font-semibold text-slate-900">{label}</span>
    </button>
  );
}

function GlanceTile({ icon: Icon, label, value, description, tone = 'slate' }) {
  const styles = getToneStyles(tone);

  return (
    <div className={`rounded-2xl border px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)] ${styles.panel}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${styles.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function AttentionCard({ icon: Icon, title, description, value, onClick, actionLabel, tone = 'slate' }) {
  const styles = getToneStyles(tone);

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${styles.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      <button
        type="button"
        onClick={onClick}
        className={`mt-4 inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200/80 bg-white px-4 text-sm font-semibold text-slate-900 transition-colors ${styles.surface}`}
      >
        {actionLabel}
      </button>
    </div>
  );
}

function ActivityItem({ activity, onOpen, showProperty = false }) {
  const styles = getActivityStyles(activity.category);
  const Icon = styles.icon;
  const interactive = Boolean(activity.actionUrl);

  const content = (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${styles.iconClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-slate-900">{activity.title}</p>
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${styles.badgeClass}`}>
            {styles.badge}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-600">{activity.message}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>{formatRelativeTime(activity.timestamp)}</span>
          {showProperty && activity.propertyName ? <span>• {activity.propertyName}</span> : null}
        </div>
      </div>
    </div>
  );

  if (!interactive) {
    return <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4">{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(activity)}
      className="w-full rounded-2xl border border-slate-200/70 bg-white/80 p-4 text-left transition-all duration-200 hover:border-slate-300 hover:bg-white"
    >
      {content}
    </button>
  );
}

function BedSpotlightCard({ bed, onAction }) {
  const statusConfig = {
    AVAILABLE: {
      label: 'Available',
      badgeClass: 'border-sky-200/80 bg-sky-50 text-sky-700',
      buttonLabel: 'Add tenant',
      action: 'assign',
    },
    OCCUPIED: {
      label: 'Occupied',
      badgeClass: 'border-emerald-200/80 bg-emerald-50 text-emerald-700',
      buttonLabel: 'View payments',
      action: 'payments',
    },
    MAINTENANCE: {
      label: 'Maintenance',
      badgeClass: 'border-rose-200/80 bg-rose-50 text-rose-700',
      buttonLabel: 'Open rooms',
      action: 'rooms',
    },
    RESERVED: {
      label: 'Reserved',
      badgeClass: 'border-violet-200/80 bg-violet-50 text-violet-700',
      buttonLabel: 'Open rooms',
      action: 'rooms',
    },
  };

  const config = statusConfig[bed.status] || statusConfig.AVAILABLE;

  return (
    <div className="app-surface rounded-3xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-slate-950">
            Bed {bed.bedNumber}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Room {bed.room?.roomNumber || '-'} • {bed.room?.floor?.name || 'Floor not set'}
          </p>
        </div>
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${config.badgeClass}`}>
          {config.label}
        </span>
      </div>

      <div className="mt-4 space-y-3 text-sm text-slate-600">
        <div className="flex items-center justify-between gap-3">
          <span>Monthly rent</span>
          <span className="font-semibold text-slate-900">{formatCurrency(Number(bed.rent) || 0)}</span>
        </div>
        {bed.tenant ? (
          <>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              <span className="truncate">{bed.tenant.fullName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-slate-400" />
              <span>{bed.tenant.phone || 'No phone added'}</span>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/80 px-3 py-2 text-sm text-slate-500">
            This bed is ready for a new tenant assignment.
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onAction(config.action, bed)}
        className="mt-5 inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200/80 bg-white px-4 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50"
      >
        {config.buttonLabel}
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { stats, recentActivities, loading, error } = useSelector((state) => state.dashboard);
  const { beds, loading: bedsLoading } = useSelector((state) => state.beds);
  const { properties, selectedProperty, loading: propertiesLoading } = useSelector((state) => state.property);

  const [showActivityDrawer, setShowActivityDrawer] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activityFilter, setActivityFilter] = useState('ALL');

  useEffect(() => {
    if (isAuthenticated && properties.length === 0) {
      dispatch(fetchProperties());
    }
  }, [dispatch, isAuthenticated, properties.length]);

  useEffect(() => {
    if (!isAuthenticated || !selectedProperty?.id) return;

    dispatch(fetchDashboardStats({ propertyId: selectedProperty.id }));
    dispatch(fetchRecentActivities({ propertyId: selectedProperty.id, limit: ACTIVITY_LIMIT }));
    dispatch(fetchBeds({ propertyId: selectedProperty.id }));
  }, [dispatch, isAuthenticated, selectedProperty?.id]);

  useEffect(() => {
    setActivityFilter('ALL');
  }, [selectedProperty?.id]);

  const handleRefreshDashboard = async () => {
    if (!selectedProperty?.id) return;

    setIsRefreshing(true);
    await Promise.allSettled([
      dispatch(fetchDashboardStats({ propertyId: selectedProperty.id })),
      dispatch(fetchRecentActivities({ propertyId: selectedProperty.id, limit: ACTIVITY_LIMIT })),
      dispatch(fetchBeds({ propertyId: selectedProperty.id })),
    ]);
    setIsRefreshing(false);
  };

  const handleAction = (action, bed) => {
    switch (action) {
      case 'assign':
        router.push('/tenants');
        break;
      case 'payments':
        router.push(bed?.tenant?.id ? `/payments?tenant=${bed.tenant.id}` : '/payments');
        break;
      case 'rooms':
      default:
        router.push('/rooms');
        break;
    }
  };

  const normalizedStats = useMemo(() => {
    const totalProperties = Number(stats?.properties?.total) || properties.length || 0;
    const totalBeds = Number(stats?.beds?.total) || 0;
    const occupiedBeds = Number(stats?.beds?.occupied) || 0;
    const availableBeds = Number(stats?.beds?.available) || 0;
    const occupancyRate = Number(stats?.beds?.occupancyRate) || 0;
    const activeTenants = Number(stats?.tenants?.active) || 0;
    const totalRooms = Number(stats?.rooms?.total) || 0;
    const occupiedRooms = Number(stats?.rooms?.occupied) || 0;
    const maintenanceRooms = Number(stats?.rooms?.maintenance) || 0;
    const monthlyRevenue = Number(stats?.revenue?.monthlyRevenue) || 0;
    const pendingAmount = Number(stats?.revenue?.pendingAmount) || 0;
    const paidPayments = Number(stats?.revenue?.paidPayments) || 0;
    const pendingPayments = Number(stats?.revenue?.pendingPayments) || 0;
    const overduePayments = Number(stats?.revenue?.overduePayments) || 0;
    const totalDue = monthlyRevenue + pendingAmount;
    const collectionRate = totalDue > 0 ? (monthlyRevenue / totalDue) * 100 : 100;

    return {
      totalProperties,
      totalBeds,
      occupiedBeds,
      availableBeds,
      occupancyRate,
      activeTenants,
      totalRooms,
      occupiedRooms,
      maintenanceRooms,
      monthlyRevenue,
      pendingAmount,
      paidPayments,
      pendingPayments,
      overduePayments,
      collectionRate,
    };
  }, [properties.length, stats]);

  const bedSummary = useMemo(() => {
    const summary = {
      available: 0,
      occupied: 0,
      maintenance: 0,
      reserved: 0,
    };

    if (!Array.isArray(beds) || beds.length === 0) {
      summary.available = normalizedStats.availableBeds;
      summary.occupied = normalizedStats.occupiedBeds;
      return summary;
    }

    beds.forEach((bed) => {
      const key = String(bed.status || '').toLowerCase();
      if (summary[key] !== undefined) {
        summary[key] += 1;
      }
    });

    return summary;
  }, [beds, normalizedStats.availableBeds, normalizedStats.occupiedBeds]);

  const spotlightBeds = useMemo(() => {
    if (!Array.isArray(beds)) return [];

    const priority = {
      MAINTENANCE: 0,
      AVAILABLE: 1,
      RESERVED: 2,
      OCCUPIED: 3,
    };

    return [...beds]
      .sort((a, b) => {
        const statusDiff = (priority[a.status] ?? 9) - (priority[b.status] ?? 9);
        if (statusDiff !== 0) return statusDiff;

        const aRoomKey = `${a.room?.floor?.floorNumber || 0}-${a.room?.roomNumber || ''}-${a.bedNumber || ''}`;
        const bRoomKey = `${b.room?.floor?.floorNumber || 0}-${b.room?.roomNumber || ''}-${b.bedNumber || ''}`;
        return aRoomKey.localeCompare(bRoomKey);
      })
      .slice(0, BED_SPOTLIGHT_LIMIT);
  }, [beds]);

  const activities = useMemo(() => {
    const seen = new Set();

    return (Array.isArray(recentActivities) ? recentActivities : [])
      .map(normalizeActivity)
      .filter((activity) => {
        if (seen.has(activity.id)) return false;
        seen.add(activity.id);
        return true;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [recentActivities]);

  const visibleActivities = activities.slice(0, FEED_PREVIEW_LIMIT);
  const hasProperties = properties.length > 0;
  const hasSelectedProperty = Boolean(selectedProperty?.id);
  const showPropertyInActivities = !selectedProperty?.id && normalizedStats.totalProperties > 1;
  const loadingDashboard = propertiesLoading || loading.stats || loading.activities || bedsLoading;
  const drawerActivities =
    activityFilter === 'ALL'
      ? activities
      : activities.filter((activity) => activity.category === activityFilter);

  const activityFilterOptions = useMemo(() => {
    const counts = activities.reduce((accumulator, activity) => {
      accumulator[activity.category] = (accumulator[activity.category] || 0) + 1;
      return accumulator;
    }, {});

    return [
      { id: 'ALL', label: 'All', count: activities.length },
      ...['TENANT', 'PAYMENT', 'NOTICE', 'DOCUMENT', 'MAINTENANCE', 'SYSTEM']
        .filter((category) => counts[category] > 0)
        .map((category) => ({
          id: category,
          label: category.charAt(0) + category.slice(1).toLowerCase(),
          count: counts[category],
        })),
    ];
  }, [activities]);

  const attentionItems = useMemo(
    () => [
      {
        id: 'pending',
        icon: Wallet,
        tone: 'amber',
        title: 'Pending collections',
        value: normalizedStats.pendingPayments,
        description:
          normalizedStats.pendingPayments > 0
            ? `${normalizedStats.pendingPayments} payment entries are still open for this month.`
            : 'No pending payment entries for the selected property.',
        actionLabel: 'Open payments',
        onClick: () => router.push('/payments'),
      },
      {
        id: 'beds',
        icon: Bed,
        tone: 'sky',
        title: 'Beds to fill',
        value: bedSummary.available,
        description:
          bedSummary.available > 0
            ? `${bedSummary.available} beds are vacant and ready for new tenant assignments.`
            : 'All configured beds are currently occupied or reserved.',
        actionLabel: 'Open tenants',
        onClick: () => router.push('/tenants'),
      },
      {
        id: 'maintenance',
        icon: Wrench,
        tone: 'rose',
        title: 'Rooms in maintenance',
        value: normalizedStats.maintenanceRooms,
        description:
          normalizedStats.maintenanceRooms > 0
            ? `${normalizedStats.maintenanceRooms} rooms need maintenance visibility or updates.`
            : 'No rooms are currently marked for maintenance.',
        actionLabel: 'Open rooms',
        onClick: () => router.push('/rooms'),
      },
    ],
    [bedSummary.available, normalizedStats.maintenanceRooms, normalizedStats.pendingPayments, router]
  );

  const goToActivity = (activity) => {
    if (!activity?.actionUrl) return;
    setShowActivityDrawer(false);
    router.push(activity.actionUrl);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <div className="app-shell min-h-screen space-y-6 p-4 sm:space-y-8 sm:p-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.92),rgba(255,255,255,0.78)_34%,rgba(248,250,252,0.95)_100%)] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(56,189,248,0.18),transparent_22%),radial-gradient(circle_at_72%_82%,rgba(16,185,129,0.14),transparent_20%)]" />
          <div className="absolute inset-x-8 top-0 h-px bg-white/80" />

          <div className="relative grid gap-4 xl:grid-cols-[1fr_1fr] xl:items-stretch">
            <div className="rounded-[1.75rem] border border-white/70 bg-white/76 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Today at a glance</p>
                  <p className="mt-1 text-sm text-slate-500">Live summary for the property selected in the header</p>
                </div>
                <button
                  type="button"
                  onClick={handleRefreshDashboard}
                  disabled={!selectedProperty?.id || isRefreshing}
                  className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200/80 bg-white px-3.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <GlanceTile
                  icon={Wallet}
                  label="Pending due"
                  value={formatCurrency(normalizedStats.pendingAmount)}
                  description={`${normalizedStats.pendingPayments} open payment entries`}
                  tone="amber"
                />
                <GlanceTile
                  icon={Bed}
                  label="Beds available"
                  value={bedSummary.available}
                  description="Ready for assignment right now"
                  tone="sky"
                />
                <GlanceTile
                  icon={Clock}
                  label="Recent updates"
                  value={activities.length}
                  description="Latest tenant, payment, notice, and document activity"
                  tone="violet"
                />
                <GlanceTile
                  icon={AlertCircle}
                  label="Action items"
                  value={normalizedStats.overduePayments + normalizedStats.maintenanceRooms}
                  description="Overdues and maintenance combined"
                  tone="rose"
                />
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/70 bg-white/76 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Quick actions</p>
                  <p className="mt-1 text-sm text-slate-500">Jump into the workflows you use the most.</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-200/80 bg-sky-100/80 text-sky-700">
                  <UserPlus className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <QuickActionTile
                  icon={UserPlus}
                  label="Add tenant"
                  onClick={() => router.push('/tenants')}
                  tone="emerald"
                />
                <QuickActionTile
                  icon={CreditCard}
                  label="Record payment"
                  onClick={() => router.push('/payments')}
                  tone="violet"
                />
                <QuickActionTile
                  icon={Bell}
                  label="Publish notice"
                  onClick={() => router.push('/notices')}
                  tone="amber"
                />
                <QuickActionTile
                  icon={Building2}
                  label="Manage properties"
                  onClick={() => router.push('/properties')}
                  tone="sky"
                />
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {!hasProperties && !propertiesLoading ? (
          <section className="app-surface rounded-[2rem] p-8 text-center">
            <div className="mx-auto flex max-w-xl flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-200/80 bg-white/85 text-slate-700">
                <Building2 className="h-7 w-7" />
              </div>
              <h2 className="mt-6 text-2xl font-semibold text-slate-950">Start with your first property</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                The dashboard becomes useful only after the property, rooms, beds, tenants, and payments are
                connected. Create the property first, then the live overview will populate automatically.
              </p>
              <button
                type="button"
                onClick={() => router.push('/properties')}
                className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white px-5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50"
              >
                Open properties
              </button>
            </div>
          </section>
        ) : !hasSelectedProperty ? (
          <section className="app-surface rounded-[2rem] p-8 text-center">
            <div className="mx-auto flex max-w-xl flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-200/80 bg-white/85 text-slate-700">
                <Building2 className="h-7 w-7" />
              </div>
              <h2 className="mt-6 text-2xl font-semibold text-slate-950">Select a property to load the dashboard</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                Your dashboard metrics, activity feed, and bed spotlight are property-aware. Pick the property
                from the header to see its live operational data.
              </p>
            </div>
          </section>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <DashboardMetricCard
                title="Occupancy"
                value={`${normalizedStats.occupiedBeds}/${normalizedStats.totalBeds}`}
                subtitle={`${normalizedStats.availableBeds} beds available`}
                icon={Bed}
                accent="blue"
              />
              <DashboardMetricCard
                title="Active tenants"
                value={normalizedStats.activeTenants}
                subtitle={`${normalizedStats.occupiedRooms} rooms currently occupied`}
                icon={Users}
                accent="emerald"
              />
              <DashboardMetricCard
                title="Collected this month"
                value={formatCurrency(normalizedStats.monthlyRevenue)}
                subtitle={`${normalizedStats.paidPayments} successful payment entries`}
                icon={DollarSign}
                accent="violet"
              />
              <DashboardMetricCard
                title="Pending collections"
                value={formatCurrency(normalizedStats.pendingAmount)}
                subtitle={`${normalizedStats.pendingPayments} pending, ${normalizedStats.overduePayments} overdue`}
                icon={Wallet}
                accent="amber"
              />
            </section>

            <section className="app-surface rounded-[2rem] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Operational health</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Focus on occupancy, collections, and issues needing action.
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-slate-400" />
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Bed className="h-4 w-4 text-slate-500" />
                    Occupancy rate
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">
                    {normalizedStats.occupancyRate.toFixed(1)}%
                  </p>
                  <div className="mt-4 h-2 rounded-full bg-slate-200/80">
                    <div
                      className="h-2 rounded-full bg-slate-900"
                      style={{ width: `${Math.min(normalizedStats.occupancyRate, 100)}%` }}
                    />
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    {normalizedStats.occupiedBeds} occupied out of {normalizedStats.totalBeds} total beds
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <CheckCircle2 className="h-4 w-4 text-slate-500" />
                    Collection rate
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">
                    {normalizedStats.collectionRate.toFixed(1)}%
                  </p>
                  <div className="mt-4 h-2 rounded-full bg-slate-200/80">
                    <div
                      className="h-2 rounded-full bg-emerald-600"
                      style={{ width: `${Math.min(normalizedStats.collectionRate, 100)}%` }}
                    />
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    Paid vs pending amount for the current month
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <AlertCircle className="h-4 w-4 text-slate-500" />
                    Needs attention
                  </div>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Overdue payments</span>
                      <span className="font-semibold text-slate-950">{normalizedStats.overduePayments}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Maintenance rooms</span>
                      <span className="font-semibold text-slate-950">{normalizedStats.maintenanceRooms}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Available beds</span>
                      <span className="font-semibold text-slate-950">{bedSummary.available}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="app-surface rounded-[2rem] p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Needs attention</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Fast actions for dues, vacant inventory, and maintenance follow-up.
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-200/80 bg-amber-100/80 text-amber-700">
                  <AlertCircle className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {attentionItems.map((item) => (
                  <AttentionCard
                    key={item.id}
                    icon={item.icon}
                    title={item.title}
                    description={item.description}
                    value={item.value}
                    onClick={item.onClick}
                    actionLabel={item.actionLabel}
                    tone={item.tone}
                  />
                ))}
              </div>
            </section>

            <section className="app-surface rounded-[2rem] p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Recent activities</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Real tenant, payment, notice, and document updates appear here as work happens.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {activities.length > 0 ? (
                    <span className="text-xs font-medium text-slate-500">
                      Showing {Math.min(visibleActivities.length, activities.length)} of {activities.length}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setShowActivityDrawer(true)}
                    disabled={activities.length === 0}
                    className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200/80 bg-white px-4 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    View all
                  </button>
                </div>
              </div>

              {loading.activities && activities.length === 0 ? (
                <div className="flex items-center justify-center py-14 text-sm text-slate-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading activity feed...
                </div>
              ) : visibleActivities.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {visibleActivities.map((activity) => (
                    <ActivityItem
                      key={activity.id}
                      activity={activity}
                      onOpen={goToActivity}
                      showProperty={showPropertyInActivities}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-3xl border border-dashed border-slate-200/90 bg-white/70 px-6 py-10 text-center">
                  <Clock className="mx-auto h-10 w-10 text-slate-300" />
                  <h3 className="mt-4 text-base font-semibold text-slate-900">No activity yet</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Add tenants, record payments, publish notices, or upload documents to build the
                    activity timeline.
                  </p>
                </div>
              )}
            </section>

            <section className="app-surface rounded-[2rem] p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Bed spotlight</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Available and maintenance beds are shown first so you can act quickly.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Occupied {bedSummary.occupied}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                    Available {bedSummary.available}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    Maintenance {bedSummary.maintenance}
                  </span>
                </div>
              </div>

              {loadingDashboard && spotlightBeds.length === 0 ? (
                <div className="flex items-center justify-center py-14 text-sm text-slate-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading bed availability...
                </div>
              ) : spotlightBeds.length > 0 ? (
                <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
                  {spotlightBeds.map((bed) => (
                    <BedSpotlightCard key={bed.id} bed={bed} onAction={handleAction} />
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-3xl border border-dashed border-slate-200/90 bg-white/70 px-6 py-10 text-center">
                  <Bed className="mx-auto h-10 w-10 text-slate-300" />
                  <h3 className="mt-4 text-base font-semibold text-slate-900">No beds set up yet</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Add rooms and beds for this property to start occupancy and payment tracking.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push('/rooms')}
                    className="mt-5 inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200/80 bg-white px-4 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50"
                  >
                    Open rooms and beds
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <Drawer
        isOpen={showActivityDrawer}
        onClose={() => setShowActivityDrawer(false)}
        title="All recent activities"
        size="full"
        className="w-full sm:w-[30rem] lg:w-[36rem]"
      >
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4 text-sm text-slate-600">
            Recent activities stay inside a drawer so you can inspect the full timeline without losing the
            dashboard context. Use any item to jump to the related screen.
          </div>

          {activityFilterOptions.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {activityFilterOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setActivityFilter(option.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                    activityFilter === option.id
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{option.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${activityFilter === option.id ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {option.count}
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {drawerActivities.length > 0 ? (
            drawerActivities.map((activity) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                onOpen={goToActivity}
                showProperty={showPropertyInActivities}
              />
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200/90 bg-slate-50/70 px-5 py-10 text-center">
              <Clock className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                {activityFilter === 'ALL' ? 'No activity to show' : `No ${activityFilter.toLowerCase()} activity yet`}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {activityFilter === 'ALL'
                  ? 'Once you start operating the property, tenant, payment, notice, and document activity will appear here.'
                  : 'Try another filter or continue using the app to generate more operational history.'}
              </p>
            </div>
          )}
        </div>
      </Drawer>
    </>
  );
}
