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
  RefreshCw,
  Filter,
  Search,
  MapPin,
  Phone,
  Mail,
  Wallet,
  Activity,
  User,
  Zap,
  Shield,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Award,
  Target,
  Eye
} from 'lucide-react';

// Stunning Stats Card Component
function PremiumStatsCard({ title, value, subtitle, icon: Icon, color, trend, delay = 0 }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    pink: 'from-pink-500 to-pink-600',
    indigo: 'from-indigo-500 to-indigo-600'
  };

  const bgClasses = {
    blue: 'from-blue-50 to-blue-100',
    green: 'from-emerald-50 to-emerald-100',
    purple: 'from-purple-50 to-purple-100',
    orange: 'from-orange-50 to-orange-100',
    pink: 'from-pink-50 to-pink-100',
    indigo: 'from-indigo-50 to-indigo-100'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-elegant hover:shadow-float-lg transition-all duration-300"
    >
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${bgClasses[color]} opacity-50 group-hover:opacity-70 transition-opacity duration-300`} />
      
      {/* Content */}
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white shadow-glow-sm group-hover:shadow-glow transition-shadow duration-300`}>
            <Icon className="h-6 w-6" />
          </div>
          
          {trend && (
            <div className={`flex items-center space-x-1 text-sm font-medium ${
              trend.startsWith('+') ? 'text-emerald-600' : 'text-red-500'
            }`}>
              {trend.startsWith('+') ? 
                <ArrowUpRight className="h-4 w-4" /> : 
                <ArrowDownRight className="h-4 w-4" />
              }
              <span>{trend}</span>
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <p className="text-3xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors">
            {value}
          </p>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
      
      {/* Hover Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
          transform: 'translateX(-100%)'
        }}
        animate={{
          transform: ['translateX(-100%)', 'translateX(100%)']
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatDelay: 3
        }}
      />
    </motion.div>
  );
}

// Real-time Bed Status Card
function EnhancedBedStatusCard({ bed, onQuickAction, delay = 0 }) {
  const getStatusColor = (status, paymentStatus) => {
    if (status === 'OCCUPIED') {
      if (paymentStatus === 'overdue') return 'border-red-200 bg-gradient-to-br from-red-50 to-red-100';
      if (paymentStatus === 'due') return 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100';
      return 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100';
    }
    if (status === 'AVAILABLE') return 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100';
    if (status === 'MAINTENANCE') return 'border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100';
    return 'border-gray-200 bg-white';
  };

  const getStatusIcon = (status) => {
    if (status === 'OCCUPIED') return <Users className="w-4 h-4 text-emerald-600" />;
    if (status === 'AVAILABLE') return <Bed className="w-4 h-4 text-blue-600" />;
    if (status === 'MAINTENANCE') return <AlertCircle className="w-4 h-4 text-gray-600" />;
    return <Bed className="w-4 h-4 text-gray-400" />;
  };

  const tenant = bed.tenant;
  const paymentStatus = tenant?.paymentStatus || 'current';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={{ scale: 1.03, y: -4 }}
      className={`group relative overflow-hidden rounded-2xl border-2 shadow-elegant hover:shadow-float transition-all duration-300 cursor-pointer ${getStatusColor(bed.status, paymentStatus)}`}
    >
      {/* Status Indicator */}
      <div className="absolute top-3 right-3">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`w-3 h-3 rounded-full ${
            bed.status === 'OCCUPIED' ? 'bg-emerald-500' :
            bed.status === 'AVAILABLE' ? 'bg-blue-500' : 'bg-gray-500'
          }`}
        />
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm shadow-sm">
            {getStatusIcon(bed.status)}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Bed {bed.bedNumber}</h4>
              <p className="text-xs text-gray-600">
                Room {bed.room?.roomNumber} • Floor {bed.room?.floor?.name}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">₹{bed.rent}</p>
            <p className="text-xs text-gray-500">{bed.bedType}</p>
          </div>
        </div>

        {/* Tenant Info */}
        {tenant ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 mb-4"
          >
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-900">{tenant.fullName}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-600">{tenant.phone}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-600">
                Joined {formatDate(tenant.joiningDate)}
              </span>
            </div>
            
            {/* Payment Status */}
            <div className="flex items-center justify-between pt-2 border-t border-white/50">
              <div className="flex items-center space-x-1">
                <Wallet className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-600">Payment:</span>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                paymentStatus === 'current' ? 'bg-emerald-100 text-emerald-700' :
                paymentStatus === 'due' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {paymentStatus === 'current' ? 'Current' : 
                 paymentStatus === 'due' ? 'Due Soon' : 'Overdue'}
              </span>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-3 mb-4">
            <div className="flex items-center space-x-2">
              <Bed className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Available for occupancy</span>
            </div>
            <div className="text-xs text-gray-500">
              Deposit: ₹{bed.deposit}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex space-x-2">
          {bed.status === 'AVAILABLE' ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onQuickAction('assign', bed)}
              className="flex-1 btn-primary text-xs py-2"
            >
              <UserPlus className="w-3 h-3 mr-1" />
              Add Tenant
            </motion.button>
          ) : bed.status === 'OCCUPIED' ? (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onQuickAction('payment', bed)}
                className="flex-1 btn-secondary text-xs py-2"
              >
                <CreditCard className="w-3 h-3 mr-1" />
                Payment
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onQuickAction('contact', bed)}
                className="flex-1 btn-ghost text-xs py-2"
              >
                <Phone className="w-3 h-3 mr-1" />
                Contact
              </motion.button>
            </>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onQuickAction('maintenance', bed)}
              className="flex-1 btn-ghost text-xs py-2"
            >
              <AlertCircle className="w-3 h-3 mr-1" />
              Maintenance
            </motion.button>
          )}
            </div>
          </div>
      
      {/* Shimmer Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          transform: 'translateX(-100%)'
        }}
        animate={{
          transform: ['translateX(-100%)', 'translateX(100%)']
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          repeatDelay: 2
        }}
      />
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

  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for demonstration
  const mockBeds = [
    {
      id: '1',
      bedNumber: '101',
      status: 'OCCUPIED',
      rent: 8500,
      deposit: 17000,
      bedType: 'Single',
      room: { roomNumber: '101', floor: { name: 'Ground Floor' } },
      tenant: {
        fullName: 'John Doe',
        phone: '+91 9876543210',
        joiningDate: '2024-01-15',
        paymentStatus: 'current'
      }
    },
    {
      id: '2',
      bedNumber: '102',
      status: 'AVAILABLE',
      rent: 7500,
      deposit: 15000,
      bedType: 'Single',
      room: { roomNumber: '102', floor: { name: 'Ground Floor' } }
    },
    {
      id: '3',
      bedNumber: '201',
      status: 'OCCUPIED',
      rent: 9000,
      deposit: 18000,
      bedType: 'Single',
      room: { roomNumber: '201', floor: { name: 'First Floor' } },
      tenant: {
        fullName: 'Sarah Wilson',
        phone: '+91 9876543211',
        joiningDate: '2024-02-01',
        paymentStatus: 'due'
      }
    },
    {
      id: '4',
      bedNumber: '202',
      status: 'MAINTENANCE',
      rent: 8000,
      deposit: 16000,
      bedType: 'Single',
      room: { roomNumber: '202', floor: { name: 'First Floor' } }
    }
  ];

  const mockTenants = mockBeds.filter(bed => bed.tenant).map(bed => bed.tenant);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
      dispatch(addToast({
      title: 'Refreshed',
      description: 'Dashboard data updated successfully',
        variant: 'success'
      }));
  };

  if (!selectedProperty) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center h-64"
      >
        <div className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white mx-auto mb-4 shadow-glow">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Property Selected</h3>
          <p className="text-gray-600">Please select a property to view the dashboard.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-screen">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-r from-primary-500 via-primary-600 to-secondary-500 rounded-3xl p-8 text-white shadow-float-lg"
      >
        <div className="absolute inset-0 bg-hero-pattern opacity-10" />
        <div className="relative flex items-center justify-between">
        <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold mb-2"
            >
              Welcome Back! 👋
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-white/90"
            >
              Real-time management for <span className="font-semibold">{selectedProperty.name}</span>
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center space-x-4 mt-4"
            >
              <div className="flex items-center space-x-2 bg-white/20 rounded-lg px-3 py-1">
                <Activity className="w-4 h-4" />
                <span className="text-sm font-medium">Live Dashboard</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/20 rounded-lg px-3 py-1">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Real-time Updates</span>
              </div>
            </motion.div>
        </div>
        
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="hidden lg:block"
          >
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={refreshing}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 rounded-xl px-4 py-2 transition-all duration-200"
          >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">
            {refreshing ? 'Refreshing...' : 'Refresh'}
                </span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Premium Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PremiumStatsCard
          title="Total Beds"
          value="24"
          subtitle="87% occupied"
          icon={Bed}
          color="blue"
          trend="+2 this month"
          delay={0.1}
        />
        <PremiumStatsCard
          title="Active Tenants"
          value="21"
          subtitle="3 pending checkout"
          icon={Users}
          color="green"
          trend="+5 this week"
          delay={0.2}
        />
        <PremiumStatsCard
          title="Monthly Revenue"
          value="₹1,85,500"
          subtitle="From 21 tenants"
          icon={DollarSign}
          color="purple"
          trend="+12% vs last month"
          delay={0.3}
        />
        <PremiumStatsCard
          title="Occupancy Rate"
          value="87.5%"
          subtitle="Above target"
          icon={TrendingUp}
          color="orange"
          trend="+3.2% this month"
          delay={0.4}
        />
      </div>

      {/* Quick Actions & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-1"
        >
          <div className="bg-white rounded-2xl shadow-elegant border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              <Zap className="w-5 h-5 text-primary-500" />
            </div>
            
            <div className="space-y-3">
              {[
                { icon: UserPlus, label: 'Add New Tenant', color: 'blue', action: () => router.push('/tenants') },
                { icon: CreditCard, label: 'Collect Payment', color: 'green', action: () => router.push('/payments') },
                { icon: Bell, label: 'Send Notice', color: 'orange', action: () => router.push('/notices') },
                { icon: BarChart3, label: 'View Analytics', color: 'purple', action: () => router.push('/analytics') }
              ].map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={action.action}
                    className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200"
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${
                      action.color === 'blue' ? 'from-blue-500 to-blue-600' :
                      action.color === 'green' ? 'from-emerald-500 to-emerald-600' :
                      action.color === 'orange' ? 'from-orange-500 to-orange-600' :
                      'from-purple-500 to-purple-600'
                    } text-white shadow-sm`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-gray-900">{action.label}</span>
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
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-2xl shadow-elegant border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Performance Overview</h3>
              <PieChart className="w-5 h-5 text-primary-500" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white mx-auto mb-3 shadow-glow-sm">
                  <Award className="h-6 w-6" />
                </div>
                <p className="text-2xl font-bold text-emerald-600">95%</p>
                <p className="text-sm text-gray-600">Tenant Satisfaction</p>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-white mx-auto mb-3 shadow-glow-sm">
                  <Target className="h-6 w-6" />
                </div>
                <p className="text-2xl font-bold text-blue-600">98%</p>
                <p className="text-sm text-gray-600">Payment Collection</p>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500 text-white mx-auto mb-3 shadow-glow-sm">
                  <Star className="h-6 w-6" />
                </div>
                <p className="text-2xl font-bold text-purple-600">4.8</p>
                <p className="text-sm text-gray-600">Average Rating</p>
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
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Eye className="w-6 h-6 mr-3 text-primary-600" />
              Live Bed Status
          </h2>
            <p className="text-gray-600 mt-1">Real-time occupancy monitoring with instant updates</p>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-gray-600">Occupied</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span className="text-gray-600">Maintenance</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockBeds.map((bed, index) => (
            <EnhancedBedStatusCard
                key={bed.id}
                bed={bed}
                onQuickAction={handleQuickAction}
              delay={1.0 + index * 0.1}
              />
            ))}
          </div>
      </motion.div>

      {/* Recent Activities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="bg-white rounded-2xl shadow-elegant border border-gray-100 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-primary-500" />
            Recent Activities
          </h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View All
          </motion.button>
      </div>

        <div className="space-y-4">
          {[
            {
              icon: UserPlus,
              title: 'New tenant John Doe joined Room 101',
              time: '2 minutes ago',
              color: 'emerald'
            },
            {
              icon: CreditCard,
              title: 'Payment received from Sarah Wilson - ₹8,500',
              time: '15 minutes ago',
              color: 'blue'
            },
            {
              icon: Bell,
              title: 'Maintenance request submitted for Room 202',
              time: '1 hour ago',
              color: 'orange'
            },
            {
              icon: CheckCircle,
              title: 'Monthly report generated successfully',
              time: '2 hours ago',
              color: 'purple'
            }
          ].map((activity, index) => {
            const Icon = activity.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.6 + index * 0.1 }}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  activity.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                  activity.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                  activity.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                  'bg-purple-100 text-purple-600'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}