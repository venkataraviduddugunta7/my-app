'use client';

import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchDashboardData, 
  fetchDashboardStats, 
  fetchRecentActivities, 
  fetchUserDashboardSettings 
} from '@/store/slices/dashboardSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Building,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Calendar,
  Clock,
  CheckCircle
} from 'lucide-react';

function StatCard({ title, value, icon: Icon, trend, trendValue, color = "blue" }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
    red: "bg-red-50 text-red-600"
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
            {trend && (
              <div className="flex items-center mt-2">
                <TrendingUp className={`w-4 h-4 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                <span className={`text-sm ml-1 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivity({ activities }) {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'tenant_joined':
        return <Users className="w-4 h-4 text-green-500" />;
      case 'payment_received':
        return <DollarSign className="w-4 h-4 text-blue-500" />;
      case 'room_vacated':
        return <Building className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RoomStatusChart({ roomStats }) {
  const { total, occupied: occupiedRooms, available: availableRooms, maintenance: maintenanceRooms } = roomStats;
  
  const occupiedPercentage = total > 0 ? (occupiedRooms / total) * 100 : 0;
  const availablePercentage = total > 0 ? (availableRooms / total) * 100 : 0;
  const maintenancePercentage = total > 0 ? (maintenanceRooms / total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Room Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Occupied</span>
            </div>
            <span className="text-sm font-medium">{occupiedRooms} ({occupiedPercentage.toFixed(1)}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${occupiedPercentage}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Available</span>
            </div>
            <span className="text-sm font-medium">{availableRooms} ({availablePercentage.toFixed(1)}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full" 
              style={{ width: `${availablePercentage}%` }}
            ></div>
          </div>

          {maintenanceRooms > 0 && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Maintenance</span>
                </div>
                <span className="text-sm font-medium">{maintenanceRooms} ({maintenancePercentage.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full" 
                  style={{ width: `${maintenancePercentage}%` }}
                ></div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const dispatch = useDispatch();
  const { stats, recentActivities, loading, error, userSettings } = useSelector((state) => state.dashboard);
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Fetch dashboard data on component mount with batching and debouncing
  useEffect(() => {
    if (isAuthenticated && !loading.stats) {
      // Only fetch if not already loading
      const timer = setTimeout(() => {
        // Use batch fetch to reduce API calls from 3 to 1
        dispatch(fetchDashboardData());
      }, 100); // Small delay to prevent rapid successive calls

      return () => clearTimeout(timer);
    }
  }, [dispatch, isAuthenticated]); // Removed loading.stats from dependencies to prevent loops

  // Extract statistics from API response
  const {
    rooms: { total: totalRooms, occupied: occupiedRooms, available: availableRooms },
    beds: { occupancyRate },
    tenants: { total: totalTenants },
    revenue: { monthlyRevenue }
  } = stats;

  // Show loading state while fetching data
  if (loading.stats && totalRooms === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Loading your dashboard...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your PG.</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Rooms"
          value={totalRooms}
          icon={Building}
          color="blue"
        />
        <StatCard
          title="Occupied Rooms"
          value={occupiedRooms}
          icon={CheckCircle}
          trend="up"
          trendValue={`${occupancyRate}%`}
          color="green"
        />
        <StatCard
          title="Available Rooms"
          value={availableRooms}
          icon={AlertCircle}
          color="yellow"
        />
        <StatCard
          title="Total Tenants"
          value={totalTenants}
          icon={Users}
          color="blue"
        />
      </div>

      {/* Revenue and Occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-50 rounded-full">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(monthlyRevenue)}
                </p>
                <p className="text-sm text-gray-600">From {occupiedRooms} occupied rooms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Occupancy Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray={`${occupancyRate}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900">{occupancyRate}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {occupiedRooms} of {totalRooms} rooms occupied
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Target: 85%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RoomStatusChart roomStats={stats.rooms} />
        <RecentActivity activities={recentActivities} />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Building className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Add New Room</span>
            </button>
            <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Users className="w-5 h-5 text-green-600" />
              <span className="font-medium">Add New Tenant</span>
            </button>
            <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <span className="font-medium">Record Payment</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
