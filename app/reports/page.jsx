'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Button,
  Dropdown
} from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  Building,
  PieChart,
  Filter
} from 'lucide-react';

// Mock report data
const monthlyRevenue = [
  { month: 'Jan 2024', revenue: 25000, occupancy: 85 },
  { month: 'Feb 2024', revenue: 28000, occupancy: 90 },
  { month: 'Mar 2024', revenue: 26500, occupancy: 88 },
  { month: 'Apr 2024', revenue: 30000, occupancy: 95 },
  { month: 'May 2024', revenue: 32000, occupancy: 100 },
  { month: 'Jun 2024', revenue: 31000, occupancy: 97 }
];

const expenseData = [
  { category: 'Maintenance', amount: 5000, percentage: 25 },
  { category: 'Utilities', amount: 8000, percentage: 40 },
  { category: 'Cleaning', amount: 3000, percentage: 15 },
  { category: 'Security', amount: 2000, percentage: 10 },
  { category: 'Others', amount: 2000, percentage: 10 }
];

function RevenueChart() {
  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <span>Monthly Revenue Trend</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {monthlyRevenue.map((data, index) => (
            <div key={data.month} className="flex items-center space-x-4">
              <div className="w-16 text-sm font-medium text-gray-600">
                {data.month.split(' ')[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{formatCurrency(data.revenue)}</span>
                  <span className="text-sm text-gray-500">{data.occupancy}% occupied</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(data.revenue / maxRevenue) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
          <span>Total Revenue (6 months): {formatCurrency(monthlyRevenue.reduce((sum, m) => sum + m.revenue, 0))}</span>
          <span>Avg Occupancy: {Math.round(monthlyRevenue.reduce((sum, m) => sum + m.occupancy, 0) / monthlyRevenue.length)}%</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ExpenseBreakdown() {
  const totalExpenses = expenseData.reduce((sum, exp) => sum + exp.amount, 0);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <PieChart className="w-5 h-5" />
          <span>Expense Breakdown</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {expenseData.map((expense, index) => (
            <div key={expense.category} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ 
                    backgroundColor: [
                      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'
                    ][index] 
                  }}
                ></div>
                <span className="text-sm font-medium text-gray-700">{expense.category}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{formatCurrency(expense.amount)}</div>
                <div className="text-xs text-gray-500">{expense.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-900">Total Expenses</span>
            <span className="font-bold text-lg">{formatCurrency(totalExpenses)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickStats() {
  const { rooms } = useSelector((state) => state.rooms);
  const { tenants } = useSelector((state) => state.tenants);
  
  const occupiedRooms = rooms.filter(room => room.status === 'occupied').length;
  const totalRevenue = rooms.filter(room => room.status === 'occupied')
    .reduce((sum, room) => sum + room.rent, 0);
  const avgRent = totalRevenue / occupiedRooms || 0;
  const occupancyRate = ((occupiedRooms / rooms.length) * 100).toFixed(1);

  const stats = [
    {
      title: "Monthly Revenue",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: "text-green-600 bg-green-50"
    },
    {
      title: "Occupancy Rate",
      value: `${occupancyRate}%`,
      icon: Building,
      color: "text-blue-600 bg-blue-50"
    },
    {
      title: "Active Tenants",
      value: tenants.filter(t => t.status === 'active').length,
      icon: Users,
      color: "text-purple-600 bg-purple-50"
    },
    {
      title: "Avg Rent/Room",
      value: formatCurrency(avgRent),
      icon: TrendingUp,
      color: "text-yellow-600 bg-yellow-50"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState('overview');
  const [dateRange, setDateRange] = useState('6months');

  const reportOptions = [
    { value: 'overview', label: 'Overview Report' },
    { value: 'revenue', label: 'Revenue Report' },
    { value: 'occupancy', label: 'Occupancy Report' },
    { value: 'expenses', label: 'Expense Report' },
    { value: 'tenant', label: 'Tenant Report' }
  ];

  const dateOptions = [
    { value: '1month', label: 'Last Month' },
    { value: '3months', label: 'Last 3 Months' },
    { value: '6months', label: 'Last 6 Months' },
    { value: '1year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const handleExportReport = () => {
    // Mock export functionality
    alert(`Exporting ${reportOptions.find(r => r.value === reportType)?.label} for ${dateOptions.find(d => d.value === dateRange)?.label}`);
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">Comprehensive insights into your PG performance</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <FileText className="w-4 h-4 mr-2" />
            Generate PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Dropdown
                options={reportOptions}
                value={reportType}
                onChange={setReportType}
                placeholder="Select report type"
              />
            </div>
            <div className="flex-1">
              <Dropdown
                options={dateOptions}
                value={dateRange}
                onChange={setDateRange}
                placeholder="Select date range"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Advanced Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <QuickStats />

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart />
        <ExpenseBreakdown />
      </div>

      {/* Detailed Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-3 font-medium text-gray-700">Metric</th>
                  <th className="text-left p-3 font-medium text-gray-700">Current Period</th>
                  <th className="text-left p-3 font-medium text-gray-700">Previous Period</th>
                  <th className="text-left p-3 font-medium text-gray-700">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="p-3 font-medium">Total Revenue</td>
                  <td className="p-3">{formatCurrency(32000)}</td>
                  <td className="p-3">{formatCurrency(30000)}</td>
                  <td className="p-3 text-green-600">+6.7%</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Occupancy Rate</td>
                  <td className="p-3">97%</td>
                  <td className="p-3">95%</td>
                  <td className="p-3 text-green-600">+2.1%</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Average Rent</td>
                  <td className="p-3">{formatCurrency(8200)}</td>
                  <td className="p-3">{formatCurrency(8000)}</td>
                  <td className="p-3 text-green-600">+2.5%</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Total Expenses</td>
                  <td className="p-3">{formatCurrency(20000)}</td>
                  <td className="p-3">{formatCurrency(22000)}</td>
                  <td className="p-3 text-green-600">-9.1%</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Net Profit</td>
                  <td className="p-3">{formatCurrency(12000)}</td>
                  <td className="p-3">{formatCurrency(8000)}</td>
                  <td className="p-3 text-green-600">+50%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">Revenue Growth</h4>
                <p className="text-sm text-green-700 mt-1">
                  Monthly revenue has increased by 6.7% compared to last month. The occupancy rate improvement is the main driver.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
              <Building className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">High Occupancy</h4>
                <p className="text-sm text-blue-700 mt-1">
                  With 97% occupancy rate, consider increasing rent prices for new tenants or adding premium amenities.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">Cost Optimization</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Utility costs are 40% of expenses. Consider energy-efficient appliances or solar panels for long-term savings.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 