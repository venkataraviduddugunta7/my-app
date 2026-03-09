'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import apiService from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import {
  Activity,
  BarChart3,
  Building2,
  CircleAlert,
  CircleCheck,
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react';

const PERIOD_OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last 1 year' },
];

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

function StatCard({ title, value, helper, icon: Icon }) {
  return (
    <Card hover={false} className="border-gray-200/80 bg-white/85 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
            {helper && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-gray-700">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { selectedProperty } = useSelector((state) => state.property);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const loadAnalytics = useCallback(async () => {
    if (!selectedProperty?.id) return;

    setLoading(true);
    setError('');

    try {
      const response = await apiService.analytics.getDashboard(selectedProperty.id, period);
      setData(response.data || null);
    } catch (err) {
      setError(err.message || 'Failed to load analytics');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedProperty?.id, period]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const kpis = data?.kpis || {};
  const revenueByType = data?.revenue?.revenueByType || [];
  const topPayingTenants = data?.tenant?.topPayingTenants || [];
  const insights = data?.insights || [];

  const occupancyRate = toNumber(kpis.occupancyRate);
  const avgMonthlyRevenue = toNumber(kpis.monthlyRevenue);
  const outstandingAmount = toNumber(kpis.outstandingAmount);
  const retentionRate = toNumber(kpis.tenantRetentionRate);
  const avgStayDuration = toNumber(kpis.averageStayDuration);

  const activeInsightCount = useMemo(
    () => insights.filter((insight) => insight?.type === 'warning').length,
    [insights]
  );

  if (!selectedProperty) {
    return (
      <div className="space-y-6 p-6">
        <Card hover={false} className="border-gray-200 bg-white/85">
          <CardContent className="p-10 text-center text-gray-600">
            Select a property to view analytics.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-600">
            Performance and health metrics for <span className="font-medium">{selectedProperty.name}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="analytics-period">Period</label>
          <select
            id="analytics-period"
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

          <Button variant="outline" onClick={loadAnalytics} loading={loading}>
            {!loading && <RefreshCw className="h-4 w-4" />}
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {error && (
        <Card hover={false} className="border-red-200 bg-red-50/70">
          <CardContent className="flex items-center gap-2 p-4 text-sm text-red-700">
            <CircleAlert className="h-4 w-4" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      {loading && !data ? (
        <Card hover={false} className="border-gray-200 bg-white/80">
          <CardContent className="flex items-center justify-center gap-2 p-8 text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading analytics...</span>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <StatCard
              title="Occupancy Rate"
              value={`${occupancyRate.toFixed(1)}%`}
              helper="Average occupancy for selected period"
              icon={Building2}
            />
            <StatCard
              title="Average Monthly Revenue"
              value={formatCurrency(avgMonthlyRevenue)}
              helper="Based on paid collections"
              icon={TrendingUp}
            />
            <StatCard
              title="Outstanding Amount"
              value={formatCurrency(outstandingAmount)}
              helper="Pending and overdue amount"
              icon={Activity}
            />
            <StatCard
              title="Tenant Retention"
              value={`${retentionRate.toFixed(1)}%`}
              helper="How well tenants are retained"
              icon={Users}
            />
            <StatCard
              title="Average Stay"
              value={`${Math.round(avgStayDuration)} days`}
              helper="Average tenant stay duration"
              icon={BarChart3}
            />
            <StatCard
              title="Action Alerts"
              value={String(activeInsightCount)}
              helper="Warnings requiring attention"
              icon={CircleAlert}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card hover={false} className="border-gray-200/80 bg-white/85 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Revenue by Payment Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {revenueByType.length === 0 ? (
                  <p className="text-sm text-gray-600">No paid transactions found for this period.</p>
                ) : (
                  revenueByType.slice(0, 6).map((item) => (
                    <div key={`${item.payment_type}-${item.total_amount}`} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2">
                      <p className="text-sm font-medium text-gray-700">{item.payment_type.replace(/_/g, ' ')}</p>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(toNumber(item.total_amount))}</p>
                        <p className="text-xs text-gray-500">{toNumber(item.count)} payments</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card hover={false} className="border-gray-200/80 bg-white/85 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Top Paying Tenants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topPayingTenants.length === 0 ? (
                  <p className="text-sm text-gray-600">No tenant payment history in this period.</p>
                ) : (
                  topPayingTenants.slice(0, 6).map((tenant) => (
                    <div key={tenant.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{tenant.full_name}</p>
                        <p className="text-xs text-gray-500">ID: {tenant.tenant_id}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(toNumber(tenant.total_paid))}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card hover={false} className="border-gray-200/80 bg-white/85 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Operational Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.length === 0 ? (
                <div className="flex items-center gap-2 rounded-xl border border-green-100 bg-green-50/60 px-3 py-2 text-sm text-green-800">
                  <CircleCheck className="h-4 w-4" />
                  <span>No major risk signals detected in the selected period.</span>
                </div>
              ) : (
                insights.map((insight, index) => (
                  <div
                    key={`${insight.category}-${index}`}
                    className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${
                      insight.type === 'warning'
                        ? 'border-amber-200 bg-amber-50/70 text-amber-900'
                        : insight.type === 'success'
                        ? 'border-green-200 bg-green-50/70 text-green-900'
                        : 'border-blue-200 bg-blue-50/70 text-blue-900'
                    }`}
                  >
                    <CircleAlert className="mt-0.5 h-4 w-4" />
                    <div>
                      <p className="font-medium capitalize">{insight.category}</p>
                      <p>{insight.message}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
