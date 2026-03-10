'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import apiService from '@/services/api';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Download,
  FileBarChart,
  Loader2,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

const PERIOD_OPTIONS = [
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last 1 year' },
];

const REPORT_TYPES = [
  { value: 'overview', label: 'Overview' },
  { value: 'collections', label: 'Collections' },
  { value: 'occupancy', label: 'Occupancy' },
  { value: 'tenants', label: 'Tenants' },
];

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default function ReportsPage() {
  const { selectedProperty } = useSelector((state) => state.property);

  const [period, setPeriod] = useState('30d');
  const [reportType, setReportType] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [payments, setPayments] = useState([]);

  const loadReportData = useCallback(async () => {
    if (!selectedProperty?.id) return;

    setLoading(true);
    setError('');

    try {
      const [analyticsResponse, paymentsResponse] = await Promise.all([
        apiService.analytics.getDashboard(selectedProperty.id, period),
        apiService.payments.getAll({ propertyId: selectedProperty.id }),
      ]);

      setAnalyticsData(analyticsResponse.data || null);
      setPayments(paymentsResponse.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load reports');
      setAnalyticsData(null);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [period, selectedProperty?.id]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const metrics = useMemo(() => {
    const kpis = analyticsData?.kpis || {};

    const totalRevenue = payments
      .filter((payment) => payment.status === 'PAID')
      .reduce((sum, payment) => sum + toNumber(payment.amount), 0);

    const outstanding = payments
      .filter((payment) => payment.status === 'PENDING' || payment.status === 'OVERDUE' || payment.status === 'PARTIAL')
      .reduce((sum, payment) => sum + toNumber(payment.amount), 0);

    const totalPayments = payments.length;
    const paidPayments = payments.filter((payment) => payment.status === 'PAID').length;
    const collectionRate = totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0;

    return {
      occupancyRate: toNumber(kpis.occupancyRate),
      avgMonthlyRevenue: toNumber(kpis.monthlyRevenue),
      outstandingAmount: toNumber(kpis.outstandingAmount) || outstanding,
      tenantRetentionRate: toNumber(kpis.tenantRetentionRate),
      averageStayDuration: toNumber(kpis.averageStayDuration),
      totalRevenue,
      outstanding,
      collectionRate,
      totalPayments,
      paidPayments,
      pendingPayments: payments.filter((payment) => payment.status === 'PENDING').length,
      overduePayments: payments.filter((payment) => payment.status === 'OVERDUE').length,
    };
  }, [analyticsData, payments]);

  const reportRows = useMemo(() => {
    const rows = [
      {
        metric: 'Collection Rate',
        value: `${metrics.collectionRate.toFixed(1)}%`,
        note: `${metrics.paidPayments} of ${metrics.totalPayments} payments collected`,
      },
      {
        metric: 'Total Collected Revenue',
        value: formatCurrency(metrics.totalRevenue),
        note: 'Paid entries in current dataset',
      },
      {
        metric: 'Outstanding Balance',
        value: formatCurrency(metrics.outstandingAmount),
        note: 'Pending + overdue dues',
      },
      {
        metric: 'Occupancy',
        value: `${metrics.occupancyRate.toFixed(1)}%`,
        note: 'Average occupancy for selected period',
      },
      {
        metric: 'Tenant Retention',
        value: `${metrics.tenantRetentionRate.toFixed(1)}%`,
        note: `Average stay ${Math.round(metrics.averageStayDuration)} days`,
      },
    ];

    if (reportType === 'collections') {
      return rows.slice(0, 3);
    }

    if (reportType === 'occupancy') {
      return rows.filter((row) => row.metric === 'Occupancy' || row.metric === 'Tenant Retention');
    }

    if (reportType === 'tenants') {
      return rows.filter((row) => row.metric === 'Tenant Retention' || row.metric === 'Outstanding Balance');
    }

    return rows;
  }, [metrics, reportType]);

  const exportCsv = () => {
    const lines = [
      ['Metric', 'Value', 'Note'].join(','),
      ...reportRows.map((row) => [row.metric, row.value, row.note].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')),
    ];

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `pg-report-${selectedProperty?.id || 'property'}-${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (!selectedProperty) {
    return (
      <div className="space-y-6 p-6">
        <Card hover={false} className="border-gray-200 bg-white/85">
          <CardContent className="p-10 text-center text-gray-600">
            Select a property to generate reports.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-600">
            Decision-focused report view for <span className="font-medium">{selectedProperty.name}</span>
          </p>
          {analyticsData?.startDate && analyticsData?.endDate && (
            <p className="mt-1 text-xs text-gray-500">
              Reporting window: {formatDate(analyticsData.startDate)} - {formatDate(analyticsData.endDate)}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={reportType}
            onChange={(event) => setReportType(event.target.value)}
            className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {REPORT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <Button variant="outline" onClick={loadReportData} loading={loading}>
            {!loading && <RefreshCw className="h-4 w-4" />}
            <span>Refresh</span>
          </Button>

          <Button onClick={exportCsv} disabled={reportRows.length === 0}>
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {error && (
        <Card hover={false} className="border-red-200 bg-red-50/70">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card hover={false} className="border-gray-200/80 bg-white/85 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-gray-600">Collection Rate</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{metrics.collectionRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card hover={false} className="border-gray-200/80 bg-white/85 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(metrics.totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card hover={false} className="border-gray-200/80 bg-white/85 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-gray-600">Outstanding</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrency(metrics.outstandingAmount)}</p>
          </CardContent>
        </Card>
        <Card hover={false} className="border-gray-200/80 bg-white/85 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-gray-600">Occupancy</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{metrics.occupancyRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      <Card hover={false} className="border-gray-200/80 bg-white/85 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileBarChart className="h-4 w-4" />
            Report Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating report...</span>
            </div>
          ) : reportRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-600">No report data available.</p>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {reportRows.map((row) => (
                  <div key={row.metric} className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm">
                    <p className="text-sm font-semibold text-gray-900">{row.metric}</p>
                    <p className="mt-1 text-base font-semibold text-gray-900">{row.value}</p>
                    <p className="mt-2 text-sm text-gray-600">{row.note}</p>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto rounded-2xl border border-gray-200/80 bg-white md:block">
                <table className="min-w-[720px] w-full text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100/70">
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-4 py-3">Metric</th>
                      <th className="px-4 py-3">Value</th>
                      <th className="px-4 py-3">Interpretation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reportRows.map((row) => (
                      <tr key={row.metric}>
                        <td className="px-4 py-3 font-medium text-gray-900">{row.metric}</td>
                        <td className="px-4 py-3 text-gray-900">{row.value}</td>
                        <td className="px-4 py-3 text-gray-600">{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card hover={false} className="border-gray-200/80 bg-white/85 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Action Guidance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-700">
          <p>
            1. Keep collection rate above 90% by following up pending payments before due date.
          </p>
          <p>
            2. Track overdue dues weekly; escalate if tenant dues cross one month rent.
          </p>
          <p>
            3. Monitor occupancy and retention together to avoid short-term revenue spikes with high churn.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
