'use client';

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  fetchDashboardData, 
  fetchDashboardStats, 
  fetchRecentActivities 
} from '@/store/slices/dashboardSlice';
import { fetchBeds } from '@/store/slices/bedsSlice';
import { fetchTenants, createTenant } from '@/store/slices/tenantsSlice';
import { fetchFloors } from '@/store/slices/floorsSlice';
import { fetchRooms } from '@/store/slices/roomsSlice';
import { fetchProperties } from '@/store/slices/propertySlice';
import { addToast } from '@/store/slices/uiSlice';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Calendar,
  Clock,
  CheckCircle,
  Plus,
  Bed,
  Home,
  UserPlus,
  CreditCard,
  Bell,
  Filter,
  Search,
  MapPin,
  Phone,
  Mail,
  Wallet,
  User,
  Zap,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Award,
  Target,
  Eye
} from 'lucide-react';

// Dashboard Stats Card
function PremiumStatsCard({ title, value, subtitle, icon: Icon, color, trend, delay = 0 }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    purple: 'from-violet-500 to-indigo-600',
    orange: 'from-orange-500 to-amber-500',
    pink: 'from-pink-500 to-rose-500',
    indigo: 'from-indigo-500 to-indigo-600'
  };

  const bgClasses = {
    blue: 'from-blue-50/70 to-blue-100/50',
    green: 'from-emerald-50/70 to-emerald-100/50',
    purple: 'from-violet-50/70 to-indigo-100/50',
    orange: 'from-orange-50/70 to-amber-100/50',
    pink: 'from-pink-50/70 to-rose-100/50',
    indigo: 'from-indigo-50/70 to-indigo-100/50'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/88 shadow-sm backdrop-blur-sm transition-shadow duration-200 hover:shadow-md"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${bgClasses[color]} opacity-75`} />

      <div className="relative p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className={`flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br ${colorClasses[color]} text-white shadow-sm`}>
            <Icon className="h-5 w-5" />
          </div>

          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium ${
              trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-500'
            }`}>
              {trend.startsWith('+')
                ? <ArrowUpRight className="h-4 w-4" />
                : <ArrowDownRight className="h-4 w-4" />}
              <span>{trend}</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-medium text-slate-600">{title}</h3>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
    </motion.div>
  );
}

// Real-time Bed Status Card
function EnhancedBedStatusCard({ bed, onQuickAction, delay = 0 }) {
  const getStatusColor = (status, paymentStatus) => {
    if (status === 'OCCUPIED') {
      if (paymentStatus === 'overdue') return 'border-rose-200/70 bg-rose-50/70';
      if (paymentStatus === 'due') return 'border-amber-200/70 bg-amber-50/70';
      return 'border-emerald-200/70 bg-emerald-50/70';
    }
    if (status === 'AVAILABLE') return 'border-blue-200/70 bg-blue-50/70';
    if (status === 'MAINTENANCE') return 'border-slate-200/80 bg-slate-50/75';
    return 'border-slate-200/80 bg-white/85';
  };

  const getStatusIcon = (status) => {
    if (status === 'OCCUPIED') return <Users className="h-4 w-4 text-emerald-600" />;
    if (status === 'AVAILABLE') return <Bed className="h-4 w-4 text-blue-600" />;
    if (status === 'MAINTENANCE') return <AlertCircle className="h-4 w-4 text-slate-600" />;
    return <Bed className="h-4 w-4 text-slate-400" />;
  };

  const tenant = bed.tenant;
  const paymentStatus = tenant?.paymentStatus || 'current';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay, ease: 'easeOut' }}
      className={`group relative overflow-hidden rounded-2xl border bg-white/88 shadow-sm backdrop-blur-sm transition-shadow duration-200 hover:shadow-md ${getStatusColor(bed.status, paymentStatus)}`}
    >
      <div className="absolute right-3 top-3">
        <div className={`h-2.5 w-2.5 rounded-full ${
          bed.status === 'OCCUPIED' ? 'bg-emerald-500' :
          bed.status === 'AVAILABLE' ? 'bg-blue-500' : 'bg-slate-500'
        }`} />
      </div>

      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/70 bg-white/80 shadow-sm">
              {getStatusIcon(bed.status)}
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">Bed {bed.bedNumber}</h4>
              <p className="text-xs text-slate-600">
                Room {bed.room?.roomNumber} • Floor {bed.room?.floor?.name}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-slate-900">₹{bed.rent}</p>
            <p className="text-xs text-slate-500">{bed.bedType}</p>
          </div>
        </div>

        {tenant ? (
          <div className="mb-4 space-y-3">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-900">{tenant.fullName}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-slate-500" />
              <span className="text-xs text-slate-600">{tenant.phone}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span className="text-xs text-slate-600">
                Joined {formatDate(tenant.joiningDate)}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200/70 pt-2">
              <div className="flex items-center space-x-1">
                <Wallet className="h-4 w-4 text-slate-500" />
                <span className="text-xs text-slate-600">Payment:</span>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                paymentStatus === 'current' ? 'bg-emerald-100 text-emerald-700' :
                paymentStatus === 'due' ? 'bg-amber-100 text-amber-700' :
                'bg-rose-100 text-rose-700'
              }`}>
                {paymentStatus === 'current' ? 'Current' :
                 paymentStatus === 'due' ? 'Due Soon' : 'Overdue'}
              </span>
            </div>
          </div>
        ) : (
          <div className="mb-4 space-y-3">
            <div className="flex items-center space-x-2">
              <Bed className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-600">Available for occupancy</span>
            </div>
            <div className="text-xs text-slate-500">
              Deposit: ₹{bed.deposit}
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          {bed.status === 'AVAILABLE' ? (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onQuickAction('assign', bed)}
              className="btn-primary flex-1 py-2 text-xs"
            >
              <UserPlus className="mr-1 h-3 w-3" />
              Add Tenant
            </motion.button>
          ) : bed.status === 'OCCUPIED' ? (
            <>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onQuickAction('payment', bed)}
                className="btn-secondary flex-1 py-2 text-xs"
              >
                <CreditCard className="mr-1 h-3 w-3" />
                Payment
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onQuickAction('contact', bed)}
                className="btn-ghost flex-1 py-2 text-xs"
              >
                <Phone className="mr-1 h-3 w-3" />
                Contact
              </motion.button>
            </>
          ) : (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onQuickAction('maintenance', bed)}
              className="btn-ghost flex-1 py-2 text-xs"
            >
              <AlertCircle className="mr-1 h-3 w-3" />
              Maintenance
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { stats, recentActivities, loading, error } = useSelector((state) => state.dashboard);
  const { beds } = useSelector((state) => state.beds);
  const { tenants } = useSelector((state) => state.tenants);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { selectedProperty } = useSelector((state) => state.property);

  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Use real data from Redux store
  const displayBeds = beds?.length > 0 ? beds : [];
  const displayTenants = tenants?.length > 0 ? tenants : [];

  // Quick action handlers
  const handleQuickAction = (action, bed) => {
    switch (action) {
      case 'assign':
        dispatch(addToast({
          title: 'Add Tenant',
          description: `Opening tenant form for Bed ${bed.bedNumber}`,
          variant: 'info'
        }));
        break;
      case 'payment':
        router.push(`/payments?tenant=${bed.tenant?.id}`);
        break;
      case 'contact':
        if (bed.tenant?.phone) {
          window.open(`tel:${bed.tenant.phone}`, '_blank');
        }
        break;
      case 'maintenance':
        dispatch(addToast({
          title: 'Maintenance',
          description: `Maintenance request for Bed ${bed.bedNumber}`,
          variant: 'info'
        }));
        break;
    }
  };

  const property = selectedProperty || {
    id: '',
    name: 'No Property Selected',
    address: '',
    totalBeds: 0,
    occupiedBeds: 0
  };
  
  const displayStats = stats || {
    totalBeds: property.totalBeds || 0,
    occupiedBeds: property.occupiedBeds || 0,
    availableBeds: (property.totalBeds || 0) - (property.occupiedBeds || 0),
    totalTenants: displayTenants.length || 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    occupancyRate: property.totalBeds ? ((property.occupiedBeds || 0) / property.totalBeds * 100) : 0,
    collectionRate: 0
  };

  // Ensure all numeric values are properly defined and safe for calculations
  const safeStats = {
    totalBeds: Number(displayStats.totalBeds) || 0,
    occupiedBeds: Number(displayStats.occupiedBeds) || 0,
    availableBeds: Number(displayStats.availableBeds) || 0,
    totalTenants: Number(displayStats.totalTenants) || 0,
    monthlyRevenue: Number(displayStats.monthlyRevenue) || 0,
    pendingPayments: Number(displayStats.pendingPayments) || 0,
    occupancyRate: Number(displayStats.occupancyRate) || 0,
    collectionRate: Number(displayStats.collectionRate) || 0
  };
  
  const displayActivities = recentActivities?.length > 0 ? recentActivities : [];

  return (
    <div className="app-shell min-h-screen space-y-8 p-6">
      {/* Premium Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PremiumStatsCard
          title="Total Beds"
          value={safeStats.totalBeds}
          subtitle={`${(safeStats.occupancyRate || 0).toFixed(1)}% occupied`}
          icon={Bed}
          color="blue"
          trend="+2 this month"
          delay={0.1}
        />
        <PremiumStatsCard
          title="Active Tenants"
          value={safeStats.totalTenants}
          subtitle={`${safeStats.availableBeds} available`}
          icon={Users}
          color="green"
          trend="+5 this week"
          delay={0.2}
        />
        <PremiumStatsCard
          title="Monthly Revenue"
          value={formatCurrency(safeStats.monthlyRevenue) || "₹0"}
          subtitle={`From ${safeStats.totalTenants} tenants`}
          icon={DollarSign}
          color="purple"
          trend="+12% vs last month"
          delay={0.3}
        />
        <PremiumStatsCard
          title="Occupancy Rate"
          value={`${(safeStats.occupancyRate || 0).toFixed(1)}%`}
          subtitle="Above target"
          icon={TrendingUp}
          color="orange"
          trend="+3.2% this month"
          delay={0.4}
        />
      </div>

      {/* Quick Actions & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-1 h-full"
        >
          <div className="app-surface h-full rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Quick Actions
              </h3>
              <Zap className="w-5 h-5 text-primary-500" />
            </div>

            <div className="space-y-1">
              {[
                {
                  icon: UserPlus,
                  label: "Add New Tenant",
                  color: "blue",
                  action: () => router.push("/tenants"),
                },
                // {
                //   icon: CreditCard,
                //   label: "Collect Payment",
                //   color: "green",
                //   action: () => router.push("/payments"),
                // },
                {
                  icon: Bell,
                  label: "Send Notice",
                  color: "orange",
                  action: () => router.push("/notices"),
                },
                // {
                //   icon: BarChart3,
                //   label: "View Analytics",
                //   color: "purple",
                //   action: () => router.push("/analytics"),
                // },
              ].map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    whileHover={{ scale: 1.01, x: 2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={action.action}
                    className="w-full flex items-center space-x-3 rounded-xl p-3 transition-colors duration-200 hover:bg-slate-100/70"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg border ${
                        action.color === "blue"
                          ? "border-blue-200/70 bg-blue-100/60 text-blue-700"
                          : action.color === "green"
                          ? "border-emerald-200/70 bg-emerald-100/60 text-emerald-700"
                          : action.color === "orange"
                          ? "border-amber-200/70 bg-amber-100/60 text-amber-700"
                          : "border-violet-200/70 bg-violet-100/60 text-violet-700"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-slate-900">
                      {action.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="lg:col-span-2 h-full"
        >
          <div className="app-surface h-full rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Performance Overview
              </h3>
              <PieChart className="w-5 h-5 text-primary-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-xl border border-slate-200/70 bg-white/75 p-4 text-center shadow-sm">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-200/70 bg-emerald-100/60 text-emerald-700">
                  <Award className="h-6 w-6" />
                </div>
                <p className="text-2xl font-bold text-slate-900">95%</p>
                <p className="text-sm text-slate-600">Tenant Satisfaction</p>
              </div>

              <div className="rounded-xl border border-slate-200/70 bg-white/75 p-4 text-center shadow-sm">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-blue-200/70 bg-blue-100/60 text-blue-700">
                  <Target className="h-6 w-6" />
                </div>
                <p className="text-2xl font-bold text-slate-900">98%</p>
                <p className="text-sm text-slate-600">Payment Collection</p>
              </div>

              <div className="rounded-xl border border-slate-200/70 bg-white/75 p-4 text-center shadow-sm">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-violet-200/70 bg-violet-100/60 text-violet-700">
                  <Star className="h-6 w-6" />
                </div>
                <p className="text-2xl font-bold text-slate-900">4.8</p>
                <p className="text-sm text-slate-600">Average Rating</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Live Bed Status Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="flex items-center text-2xl font-bold text-slate-900">
              <Eye className="w-6 h-6 mr-3 text-primary-600" />
              Live Bed Status
            </h2>
            <p className="mt-1 text-slate-600">
              Real-time occupancy monitoring with instant updates
            </p>
          </div>

          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
              <span className="text-slate-600">Occupied</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
              <span className="text-slate-600">Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full bg-gray-500"></div>
              <span className="text-slate-600">Maintenance</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayBeds.length > 0 ? (
            displayBeds.map((bed, index) => (
              <EnhancedBedStatusCard
                key={bed.id}
                bed={bed}
                onQuickAction={handleQuickAction}
                delay={1.0 + index * 0.1}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Bed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="mb-2 text-lg font-semibold text-slate-900">
                No Beds Found
              </h3>
              <p className="mb-4 text-slate-600">
                No beds are available for this property yet.
              </p>
              <button
                onClick={() => router.push("/beds")}
                className="btn-primary"
              >
                Manage Beds
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Recent Activities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="app-surface rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="flex items-center text-lg font-semibold text-slate-900">
            <Clock className="w-5 h-5 mr-2 text-primary-500" />
            Recent Activities
          </h3>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View All
          </motion.button>
        </div>

        <div className="space-y-4">
          {[
            {
              icon: UserPlus,
              title: "New tenant John Doe joined Room 101",
              time: "2 minutes ago",
              color: "emerald",
            },
            {
              icon: CreditCard,
              title: "Payment received from Sarah Wilson - ₹8,500",
              time: "15 minutes ago",
              color: "blue",
            },
            {
              icon: Bell,
              title: "Maintenance request submitted for Room 202",
              time: "1 hour ago",
              color: "orange",
            },
            {
              icon: CheckCircle,
              title: "Monthly report generated successfully",
              time: "2 hours ago",
              color: "purple",
            },
          ].map((activity, index) => {
            const Icon = activity.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.6 + index * 0.1 }}
                className="flex items-center space-x-3 rounded-lg p-3 transition-colors duration-200 hover:bg-slate-100/70"
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    activity.color === "emerald"
                      ? "border border-emerald-200/70 bg-emerald-100/60 text-emerald-700"
                      : activity.color === "blue"
                      ? "border border-blue-200/70 bg-blue-100/60 text-blue-700"
                      : activity.color === "orange"
                      ? "border border-amber-200/70 bg-amber-100/60 text-amber-700"
                      : "border border-violet-200/70 bg-violet-100/60 text-violet-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    {activity.title}
                  </p>
                  <p className="text-xs text-slate-500">{activity.time}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
