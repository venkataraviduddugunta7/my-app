'use client';

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
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
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Dropdown, Modal, ModalFooter } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import apiService from '@/services/api';
import {
  Building,
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
  User
} from 'lucide-react';

// Real-time Bed Status Card
function BedStatusCard({ bed, onQuickAction }) {
  const getStatusColor = (status, paymentStatus) => {
    if (status === 'OCCUPIED') {
      if (paymentStatus === 'overdue') return 'border-red-200 bg-red-50';
      if (paymentStatus === 'due') return 'border-yellow-200 bg-yellow-50';
      return 'border-green-200 bg-green-50';
    }
    if (status === 'AVAILABLE') return 'border-blue-200 bg-blue-50';
    if (status === 'MAINTENANCE') return 'border-gray-200 bg-gray-50';
    return 'border-gray-200 bg-white';
  };

  const getStatusIcon = (status) => {
    if (status === 'OCCUPIED') return <Users className="w-4 h-4 text-green-600" />;
    if (status === 'AVAILABLE') return <Bed className="w-4 h-4 text-blue-600" />;
    if (status === 'MAINTENANCE') return <AlertCircle className="w-4 h-4 text-gray-600" />;
    return <Bed className="w-4 h-4 text-gray-400" />;
  };

  const tenant = bed.tenant;
  const paymentStatus = tenant?.paymentStatus || 'current'; // This would come from payment calculations

  return (
    <Card className={`${getStatusColor(bed.status, paymentStatus)} border-2 hover:shadow-md transition-shadow cursor-pointer`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getStatusIcon(bed.status)}
            <div>
              <h4 className="font-semibold text-gray-900">Bed {bed.bedNumber}</h4>
              <p className="text-xs text-gray-600">
                Room {bed.room?.roomNumber} • Floor {bed.room?.floor?.name}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">₹{bed.rent}/mo</p>
            <p className="text-xs text-gray-500">{bed.bedType}</p>
          </div>
        </div>

        {/* Tenant Info */}
        {tenant ? (
          <div className="space-y-2 mb-3">
            <div className="flex items-center space-x-2">
              <User className="w-3 h-3 text-gray-500" />
              <span className="text-sm font-medium text-gray-900">{tenant.fullName}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-600">{tenant.phone}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-600">
                Joined {formatDate(tenant.joiningDate)}
              </span>
            </div>
            
            {/* Payment Status */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <div className="flex items-center space-x-1">
                <Wallet className="w-3 h-3 text-gray-500" />
                <span className="text-xs text-gray-600">Payment:</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                paymentStatus === 'current' ? 'bg-green-100 text-green-700' :
                paymentStatus === 'due' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {paymentStatus === 'current' ? 'Current' : 
                 paymentStatus === 'due' ? 'Due Soon' : 'Overdue'}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-2 mb-3">
            <div className="flex items-center space-x-2">
              <Bed className="w-3 h-3 text-gray-500" />
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
            <Button 
              size="sm" 
              className="flex-1 text-xs py-1"
              onClick={() => onQuickAction('assign', bed)}
            >
              <UserPlus className="w-3 h-3 mr-1" />
              Add Tenant
            </Button>
          ) : bed.status === 'OCCUPIED' ? (
            <>
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 text-xs py-1"
                onClick={() => onQuickAction('payment', bed)}
              >
                <CreditCard className="w-3 h-3 mr-1" />
                Payment
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 text-xs py-1"
                onClick={() => onQuickAction('contact', bed)}
              >
                <Phone className="w-3 h-3 mr-1" />
                Contact
              </Button>
            </>
          ) : (
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 text-xs py-1"
              onClick={() => onQuickAction('maintenance', bed)}
            >
              <AlertCircle className="w-3 h-3 mr-1" />
              Maintenance
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Stats Overview
function QuickStatsOverview({ beds, tenants }) {
  const occupiedBeds = beds.filter(bed => bed.status === 'OCCUPIED').length;
  const availableBeds = beds.filter(bed => bed.status === 'AVAILABLE').length;
  const maintenanceBeds = beds.filter(bed => bed.status === 'MAINTENANCE').length;
  const occupancyRate = beds.length > 0 ? ((occupiedBeds / beds.length) * 100).toFixed(1) : 0;
  
  const activeTenants = tenants.filter(t => t.status === 'ACTIVE').length;
  const pendingTenants = tenants.filter(t => t.status === 'PENDING').length;
  
  // Calculate revenue (simplified - in real app, would come from payments)
  const monthlyRevenue = beds.filter(bed => bed.status === 'OCCUPIED')
    .reduce((sum, bed) => sum + (bed.rent || 0), 0);

  // Payment status calculations (mock data - would come from payment records)
  const currentPayments = Math.floor(activeTenants * 0.7);
  const duePayments = Math.floor(activeTenants * 0.2);
  const overduePayments = activeTenants - currentPayments - duePayments;

  const stats = [
    {
      title: 'Total Beds',
      value: beds.length,
      subtitle: `${occupancyRate}% occupied`,
      icon: Bed,
      color: 'blue',
      trend: '+2 this month'
    },
    {
      title: 'Occupied',
      value: occupiedBeds,
      subtitle: `${availableBeds} available`,
      icon: CheckCircle,
      color: 'green',
      trend: `${occupancyRate}% occupancy`
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(monthlyRevenue),
      subtitle: `From ${occupiedBeds} beds`,
      icon: DollarSign,
      color: 'green',
      trend: '+8% vs last month'
    },
    {
      title: 'Active Tenants',
      value: activeTenants,
      subtitle: `${pendingTenants} pending`,
      icon: Users,
      color: 'blue',
      trend: `${currentPayments} current payments`
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="border-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                  <p className="text-xs text-green-600 font-medium mt-1">{stat.trend}</p>
                </div>
                <div className={`p-3 rounded-lg border-2 ${colorClasses[stat.color]}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Payment Status Overview
function PaymentStatusOverview({ tenants }) {
  // Mock payment calculations - in real app, would come from payment records
  const activeTenants = tenants.filter(t => t.status === 'ACTIVE');
  const currentPayments = Math.floor(activeTenants.length * 0.7);
  const duePayments = Math.floor(activeTenants.length * 0.2);
  const overduePayments = activeTenants.length - currentPayments - duePayments;

  const paymentStats = [
    { label: 'Current', count: currentPayments, color: 'bg-green-500', textColor: 'text-green-700' },
    { label: 'Due Soon', count: duePayments, color: 'bg-yellow-500', textColor: 'text-yellow-700' },
    { label: 'Overdue', count: overduePayments, color: 'bg-red-500', textColor: 'text-red-700' }
  ];

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="w-5 h-5 mr-2" />
          Payment Status Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {paymentStats.map((stat, index) => (
            <div key={index} className="text-center p-4 rounded-lg border">
              <div className={`w-12 h-12 ${stat.color} rounded-full mx-auto mb-2 flex items-center justify-center`}>
                <span className="text-white font-bold text-lg">{stat.count}</span>
              </div>
              <p className={`font-semibold ${stat.textColor}`}>{stat.label}</p>
              <p className="text-sm text-gray-600">Tenants</p>
            </div>
          ))}
        </div>
        
        {overduePayments > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-sm font-medium text-red-700">
                {overduePayments} tenant(s) have overdue payments requiring immediate attention
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Quick Tenant Add Modal
function QuickTenantModal({ isOpen, onClose, selectedBed, onSubmit }) {
  const { properties, selectedProperty } = useSelector((state) => state.property);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    paymentMode: 'CASH',
    securityDeposit: '',
    advanceRent: ''
  });
  const [loading, setLoading] = useState(false);

  // Auto-populate financial data when bed is selected
  useEffect(() => {
    if (selectedBed) {
      const suggestedSecurityDeposit = selectedBed.rent * 2;
      const suggestedAdvanceRent = selectedBed.rent;
      
      setFormData(prev => ({
        ...prev,
        securityDeposit: suggestedSecurityDeposit.toString(),
        advanceRent: suggestedAdvanceRent.toString()
      }));
    }
  }, [selectedBed]);

  const paymentModeOptions = [
    { value: 'CASH', label: 'Cash Payment' },
    { value: 'UPI', label: 'UPI/Digital Payment' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CHEQUE', label: 'Cheque' },
    { value: 'CARD', label: 'Debit/Credit Card' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName.trim() || !formData.phone.trim()) {
      alert('Please fill in required fields');
      return;
    }

    setLoading(true);
    
    try {
      const tenantData = {
        ...formData,
        bedId: selectedBed.id,
        floorId: selectedBed.room.floorId,
        roomId: selectedBed.roomId,
        securityDeposit: parseFloat(formData.securityDeposit) || 0,
        advanceRent: parseFloat(formData.advanceRent) || 0,
        joiningDate: new Date().toISOString(),
        propertyId: selectedProperty.id,
        tenantId: `${selectedProperty.name.substring(0, 2).toUpperCase()}${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`,
        address: 'Quick add - update later',
        idProofType: 'AADHAR',
        idProofNumber: '',
        termsAccepted: true,
        termsAcceptedAt: new Date().toISOString()
      };

      await onSubmit(tenantData);
      onClose();
      
      // Reset form
      setFormData({
        fullName: '',
        phone: '',
        email: '',
        paymentMode: 'CASH',
        securityDeposit: '',
        advanceRent: ''
      });
    } catch (error) {
      console.error('Error adding tenant:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedBed) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick Add Tenant" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Bed Info */}
        <div className="bg-blue-50 p-4 rounded-lg border">
          <h4 className="font-semibold text-gray-900 mb-2">Selected Bed</h4>
          <p className="text-sm text-gray-700">
            Bed {selectedBed.bedNumber} • Room {selectedBed.room?.roomNumber} • Floor {selectedBed.room?.floor?.name}
          </p>
          <p className="text-sm text-gray-700">
            Monthly Rent: ₹{selectedBed.rent} • Deposit: ₹{selectedBed.deposit}
          </p>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name *"
            value={formData.fullName}
            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
            placeholder="Enter tenant name"
            required
          />
          <Input
            label="Phone Number *"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="Enter phone number"
            required
          />
        </div>

        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder="Enter email address"
        />

        {/* Payment Details */}
        <div className="bg-green-50 p-4 rounded-lg border">
          <h4 className="font-semibold text-gray-900 mb-3">Payment Details</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Dropdown
              label="Payment Mode"
              options={paymentModeOptions}
              value={formData.paymentMode}
              onChange={(value) => setFormData(prev => ({ ...prev, paymentMode: value }))}
            />
            <Input
              label="Security Deposit (₹)"
              type="number"
              value={formData.securityDeposit}
              onChange={(e) => setFormData(prev => ({ ...prev, securityDeposit: e.target.value }))}
              placeholder="Security deposit"
            />
            <Input
              label="Advance Rent (₹)"
              type="number"
              value={formData.advanceRent}
              onChange={(e) => setFormData(prev => ({ ...prev, advanceRent: e.target.value }))}
              placeholder="Advance rent"
            />
          </div>

          <div className="p-3 bg-white rounded border">
            <p className="text-sm font-medium text-gray-700">Total Initial Payment</p>
            <p className="text-lg font-bold text-green-700">
              ₹{(parseFloat(formData.securityDeposit) || 0) + (parseFloat(formData.advanceRent) || 0)}
            </p>
          </div>
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Tenant'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
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
  const [showQuickTenantModal, setShowQuickTenantModal] = useState(false);
  const [selectedBedForTenant, setSelectedBedForTenant] = useState(null);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isAuthenticated || !selectedProperty) return;

    const fetchData = () => {
      dispatch(fetchBeds({ propertyId: selectedProperty.id }));
      dispatch(fetchTenants({ propertyId: selectedProperty.id }));
      dispatch(fetchDashboardStats());
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [dispatch, isAuthenticated, selectedProperty]);

  // Manual refresh
  const handleRefresh = async () => {
    if (!selectedProperty) return;
    
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchBeds({ propertyId: selectedProperty.id })),
        dispatch(fetchTenants({ propertyId: selectedProperty.id })),
        dispatch(fetchDashboardStats()),
        dispatch(fetchFloors(selectedProperty.id)),
        dispatch(fetchRooms({ propertyId: selectedProperty.id }))
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Filter beds based on status and search
  const filteredBeds = beds.filter(bed => {
    const matchesStatus = filterStatus === 'all' || bed.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch = !searchTerm || 
      bed.bedNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bed.room?.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bed.room?.floor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bed.tenant?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Quick action handlers
  const handleQuickAction = (action, bed) => {
    switch (action) {
      case 'assign':
        setSelectedBedForTenant(bed);
        setShowQuickTenantModal(true);
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
        // TODO: Implement maintenance modal
        dispatch(addToast({
          title: 'Maintenance',
          description: `Maintenance request for Bed ${bed.bedNumber}`,
          variant: 'info'
        }));
        break;
      default:
        break;
    }
  };

  const handleQuickTenantSubmit = async (tenantData) => {
    try {
      await dispatch(createTenant(tenantData)).unwrap();
      dispatch(addToast({
        title: 'Success',
        description: 'Tenant added successfully!',
        variant: 'success'
      }));
      
      // Refresh data
      handleRefresh();
    } catch (error) {
      dispatch(addToast({
        title: 'Error',
        description: error.message || 'Failed to add tenant',
        variant: 'error'
      }));
    }
  };

  const statusFilterOptions = [
    { value: 'all', label: 'All Beds' },
    { value: 'occupied', label: 'Occupied' },
    { value: 'available', label: 'Available' },
    { value: 'maintenance', label: 'Maintenance' }
  ];

  if (!selectedProperty) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Property Selected</h3>
          <p className="text-gray-600">Please select a property to view the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Activity className="w-8 h-8 mr-3 text-blue-600" />
            Live Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Real-time bed management for {selectedProperty.name}</p>
        </div>
        
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button onClick={() => router.push('/tenants')}>
            <UserPlus className="w-4 h-4 mr-2" />
            Manage Tenants
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <QuickStatsOverview beds={beds} tenants={tenants} />

      {/* Payment Status */}
      <PaymentStatusOverview tenants={tenants} />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search beds, rooms, tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
              />
            </div>
            <div className="w-48">
              <Dropdown
                options={statusFilterOptions}
                value={filterStatus}
                onChange={setFilterStatus}
                placeholder="Filter by status"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Bed Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Bed Status ({filteredBeds.length} beds)
          </h2>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Occupied</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span>Maintenance</span>
            </div>
          </div>
        </div>

        {filteredBeds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBeds.map((bed) => (
              <BedStatusCard
                key={bed.id}
                bed={bed}
                onQuickAction={handleQuickAction}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Bed className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Beds Found</h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters.' 
                  : 'Start by adding floors, rooms, and beds to your property.'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Tenant Add Modal */}
      <QuickTenantModal
        isOpen={showQuickTenantModal}
        onClose={() => {
          setShowQuickTenantModal(false);
          setSelectedBedForTenant(null);
        }}
        selectedBed={selectedBedForTenant}
        onSubmit={handleQuickTenantSubmit}
      />
    </div>
  );
}
