'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Button,
  Input,
  Dropdown
} from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  CreditCard,
  Plus,
  Download,
  Filter,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  Building,
  List,
  Grid3X3,
  Eye,
  Edit
} from 'lucide-react';

// Mock payment data
const mockPayments = [
  {
    id: 1,
    tenantName: 'Raj Kumar',
    roomNumber: '101',
    amount: 8000,
    month: 'January 2024',
    dueDate: '2024-01-01',
    paidDate: '2024-01-02',
    status: 'paid',
    method: 'UPI'
  },
  {
    id: 2,
    tenantName: 'Priya Sharma',
    roomNumber: '201',
    amount: 8500,
    month: 'January 2024',
    dueDate: '2024-01-01',
    paidDate: '2024-01-01',
    status: 'paid',
    method: 'Bank Transfer'
  },
  {
    id: 3,
    tenantName: 'Raj Kumar',
    roomNumber: '101',
    amount: 8000,
    month: 'February 2024',
    dueDate: '2024-02-01',
    paidDate: null,
    status: 'pending',
    method: null
  },
  {
    id: 4,
    tenantName: 'Priya Sharma',
    roomNumber: '201',
    amount: 8500,
    month: 'February 2024',
    dueDate: '2024-02-01',
    paidDate: null,
    status: 'overdue',
    method: null
  }
];

const statusConfig = {
  'paid': { 
    color: 'text-green-600 bg-green-50 border-green-200',
    icon: CheckCircle,
    label: 'Paid'
  },
  'pending': { 
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    icon: Clock,
    label: 'Pending'
  },
  'overdue': { 
    color: 'text-red-600 bg-red-50 border-red-200',
    icon: AlertTriangle,
    label: 'Overdue'
  }
};

function PaymentCard({ payment }) {
  const statusInfo = statusConfig[payment.status];
  const StatusIcon = statusInfo.icon;
  
  const isOverdue = payment.status === 'overdue';
  const daysSinceOverdue = isOverdue ? 
    Math.floor((new Date() - new Date(payment.dueDate)) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{payment.month}</CardTitle>
              <p className="text-sm text-gray-500">{payment.tenantName} • Room {payment.roomNumber}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center space-x-1 ${statusInfo.color}`}>
            <StatusIcon className="w-3 h-3" />
            <span>{statusInfo.label}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Amount:</span>
          <span className="text-lg font-semibold text-green-600">{formatCurrency(payment.amount)}</span>
        </div>

        {/* Due Date */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Due Date:</span>
          <span className="text-sm font-medium">{formatDate(payment.dueDate)}</span>
        </div>

        {/* Payment Details */}
        {payment.status === 'paid' ? (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Paid Date:</span>
              <span className="text-sm font-medium">{formatDate(payment.paidDate)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Method:</span>
              <span className="text-sm font-medium">{payment.method}</span>
            </div>
          </>
        ) : (
          <div className="pt-2 border-t border-gray-100">
            {isOverdue && (
              <p className="text-sm text-red-600 mb-2">
                Overdue by {daysSinceOverdue} days
              </p>
            )}
            <Button 
              size="sm" 
              className="w-full"
              variant={isOverdue ? "destructive" : "default"}
            >
              {isOverdue ? 'Collect Overdue Payment' : 'Mark as Paid'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Payment Table Component
function PaymentTable({ payments, onView, onEdit, onMarkPaid }) {
  const getStatusBadge = (status) => {
    const statusInfo = statusConfig[status];
    const StatusIcon = statusInfo.icon;
    
    return (
      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        <StatusIcon className="w-3 h-3" />
        <span>{statusInfo.label}</span>
      </div>
    );
  };

  const getOverdueDays = (dueDate, status) => {
    if (status !== 'overdue') return null;
    return Math.floor((new Date() - new Date(dueDate)) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Payment Details
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tenant & Room
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Due Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Payment Info
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {payments.map((payment) => {
            const overdueDays = getOverdueDays(payment.dueDate, payment.status);
            return (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {payment.month}
                      </div>
                      <div className="text-sm text-gray-500">
                        Payment #{payment.id}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{payment.tenantName}</div>
                  <div className="text-sm text-gray-500">Room {payment.roomNumber}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-green-600">
                    {formatCurrency(payment.amount)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(payment.dueDate)}
                  </div>
                  {overdueDays && (
                    <div className="text-xs text-red-600">
                      {overdueDays} days overdue
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(payment.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {payment.status === 'paid' ? (
                    <div>
                      <div className="text-sm text-gray-900">
                        {formatDate(payment.paidDate)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.method}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Not paid yet
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView(payment)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {payment.status !== 'paid' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onMarkPaid(payment)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Mark Paid
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {payments.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
          <p className="text-gray-500">Try adjusting your search terms or filters.</p>
        </div>
      )}
    </div>
  );
}

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

  const monthOptions = [
    { value: 'all', label: 'All Months' },
    { value: 'January 2024', label: 'January 2024' },
    { value: 'February 2024', label: 'February 2024' },
    { value: 'March 2024', label: 'March 2024' }
  ];

  const filteredPayments = mockPayments.filter(payment => {
    const matchesSearch = payment.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.roomNumber.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    const matchesMonth = filterMonth === 'all' || payment.month === filterMonth;
    
    return matchesSearch && matchesStatus && matchesMonth;
  });

  const stats = {
    total: mockPayments.length,
    paid: mockPayments.filter(p => p.status === 'paid').length,
    pending: mockPayments.filter(p => p.status === 'pending').length,
    overdue: mockPayments.filter(p => p.status === 'overdue').length,
    totalAmount: mockPayments.reduce((sum, p) => sum + p.amount, 0),
    paidAmount: mockPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
  };

  // Handler functions
  const handleView = (payment) => {
    console.log('View payment:', payment);
    // TODO: Implement payment details modal
  };

  const handleMarkPaid = (payment) => {
    console.log('Mark as paid:', payment);
    // TODO: Implement mark as paid functionality
  };

  // Handler for status card clicks
  const handleStatusCardClick = (status) => {
    setFilterStatus(status);
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments Management</h1>
          <p className="text-gray-600 mt-2">
            Track and manage all rent payments ({filteredPayments.length}{filteredPayments.length !== mockPayments.length ? `/${mockPayments.length}` : ''})
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className={`cursor-pointer transition-all duration-200 ${
            filterStatus === 'all' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-lg'
          }`}
          onClick={() => handleStatusCardClick('all')}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Payments</p>
                <p className="text-xl font-bold">{stats.total}</p>
                {filterStatus === 'all' && (
                  <span className="text-xs text-blue-600 font-medium">Active Filter</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all duration-200 ${
            filterStatus === 'paid' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:shadow-lg'
          }`}
          onClick={() => handleStatusCardClick('paid')}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-xl font-bold text-green-600">{stats.paid}</p>
                {filterStatus === 'paid' && (
                  <span className="text-xs text-green-600 font-medium">Active Filter</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all duration-200 ${
            filterStatus === 'pending' ? 'ring-2 ring-yellow-500 bg-yellow-50' : 'hover:shadow-lg'
          }`}
          onClick={() => handleStatusCardClick('pending')}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
                {filterStatus === 'pending' && (
                  <span className="text-xs text-yellow-600 font-medium">Active Filter</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all duration-200 ${
            filterStatus === 'overdue' ? 'ring-2 ring-red-500 bg-red-50' : 'hover:shadow-lg'
          }`}
          onClick={() => handleStatusCardClick('overdue')}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-xl font-bold text-red-600">{stats.overdue}</p>
                {filterStatus === 'overdue' && (
                  <span className="text-xs text-red-600 font-medium">Active Filter</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-50 rounded-full">
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(stats.totalAmount)}
                </p>
                <p className="text-sm text-gray-600">Expected this month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Collected Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-50 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(stats.paidAmount)}
                </p>
                <p className="text-sm text-gray-600">
                  {((stats.paidAmount / stats.totalAmount) * 100).toFixed(1)}% collected
                </p>
              </div>
            </div>
          </CardContent>
                </Card>
      </div>

      {/* Controls Section */}
      {mockPayments.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <div className="w-full sm:w-80">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by tenant name or room..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-48">
                  <Dropdown
                    options={monthOptions}
                    value={filterMonth}
                    onChange={setFilterMonth}
                    placeholder="Filter by month"
                  />
                </div>
              </div>

              {/* View Mode and Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'table'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    <span>Table</span>
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'cards'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                    <span>Cards</span>
                  </button>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center space-x-3">
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Record Payment
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments Display */}
      {filteredPayments.length > 0 && (
        <>
          {viewMode === 'table' ? (
            <Card>
              <CardContent className="p-0">
                <PaymentTable
                  payments={filteredPayments}
                  onView={handleView}
                  onMarkPaid={handleMarkPaid}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPayments.map((payment) => (
                <PaymentCard key={payment.id} payment={payment} />
              ))}
            </div>
          )}
        </>
      )}

      {filteredPayments.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterStatus !== 'all' || filterMonth !== 'all'
                ? 'Try adjusting your search terms or clear the filters to see all payments.' 
                : 'No payment records available.'}
            </p>
            {searchTerm || filterStatus !== 'all' || filterMonth !== 'all' ? (
              <Button variant="outline" onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterMonth('all');
              }}>
                Clear Filters
              </Button>
            ) : (
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Record Your First Payment
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 