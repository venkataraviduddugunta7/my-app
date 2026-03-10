'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import apiService from '@/services/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Modal } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  CheckCircle2,
  CircleAlert,
  CreditCard,
  Loader2,
  Plus,
  RefreshCw,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const PAYMENT_TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'RENT', label: 'Rent' },
  { value: 'DEPOSIT', label: 'Deposit' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'ELECTRICITY', label: 'Electricity' },
  { value: 'WATER', label: 'Water' },
  { value: 'INTERNET', label: 'Internet' },
  { value: 'LAUNDRY', label: 'Laundry' },
  { value: 'LATE_FEE', label: 'Late Fee' },
  { value: 'OTHER', label: 'Other' },
];

const PAYMENT_METHOD_OPTIONS = ['CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE'];

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

function PaymentStatCard({ title, value, helper }) {
  return (
    <Card hover={false} className="border-gray-200/80 bg-white/85 shadow-sm">
      <CardContent className="p-5">
        <p className="text-sm text-gray-600">{title}</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
        {helper && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
      </CardContent>
    </Card>
  );
}

export default function PaymentsPage() {
  const { selectedProperty } = useSelector((state) => state.property);

  const [filters, setFilters] = useState({
    status: '',
    paymentType: '',
    search: '',
    month: '',
    year: String(new Date().getFullYear()),
  });

  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [createForm, setCreateForm] = useState({
    paymentId: '',
    tenantId: '',
    amount: '',
    paymentType: 'RENT',
    paymentMethod: 'UPI',
    dueDate: '',
    description: '',
  });

  const [createErrors, setCreateErrors] = useState({});

  const loadPayments = useCallback(async () => {
    if (!selectedProperty?.id) return;

    setLoading(true);
    setError('');

    try {
      const query = {
        propertyId: selectedProperty.id,
        status: filters.status,
        paymentType: filters.paymentType,
        month: filters.month,
        year: filters.year,
      };

      const [paymentsRes, statsRes] = await Promise.all([
        apiService.payments.getAll(query),
        apiService.payments.getStats({ propertyId: selectedProperty.id, year: filters.year }),
      ]);

      const allPayments = paymentsRes.data || [];
      const normalizedSearch = filters.search.trim().toLowerCase();

      const filteredPayments = normalizedSearch
        ? allPayments.filter((payment) => {
            const paymentId = String(payment.paymentId || '').toLowerCase();
            const tenantName = String(payment.tenant?.fullName || '').toLowerCase();
            const tenantId = String(payment.tenant?.tenantId || '').toLowerCase();
            return paymentId.includes(normalizedSearch) || tenantName.includes(normalizedSearch) || tenantId.includes(normalizedSearch);
          })
        : allPayments;

      setPayments(filteredPayments);
      setStats(statsRes.data || null);
    } catch (err) {
      setError(err.message || 'Failed to load payments');
      setPayments([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [
    filters.month,
    filters.paymentType,
    filters.search,
    filters.status,
    filters.year,
    selectedProperty?.id,
  ]);

  const loadTenants = useCallback(async () => {
    if (!selectedProperty?.id) return;

    try {
      const response = await apiService.tenants.getAll({ propertyId: selectedProperty.id, status: 'ACTIVE' });
      setTenants(response.data || []);
    } catch {
      setTenants([]);
    }
  }, [selectedProperty?.id]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  useEffect(() => {
    if (showCreateModal) {
      loadTenants();
    }
  }, [loadTenants, showCreateModal]);

  const summary = useMemo(() => {
    const data = stats || {};
    return {
      totalPayments: toNumber(data.totalPayments),
      paidPayments: toNumber(data.paidPayments),
      pendingPayments: toNumber(data.pendingPayments),
      overduePayments: toNumber(data.overduePayments),
      totalRevenue: toNumber(data.totalRevenue),
      paidRevenue: toNumber(data.paidRevenue),
      pendingRevenue: toNumber(data.pendingRevenue),
    };
  }, [stats]);

  const onFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const markAsPaid = async (payment) => {
    if (!payment?.id || payment.status === 'PAID') return;

    try {
      await apiService.payments.markPaid(payment.id, {
        paymentMethod: payment.paymentMethod || 'UPI',
        paidDate: new Date().toISOString(),
      });
      await loadPayments();
    } catch (err) {
      setError(err.message || 'Failed to mark payment as paid');
    }
  };

  const validateCreateForm = () => {
    const errors = {};

    if (!createForm.tenantId) {
      errors.tenantId = 'Tenant is required';
    }

    if (!createForm.amount || toNumber(createForm.amount) <= 0) {
      errors.amount = 'Enter a valid amount';
    }

    if (!createForm.dueDate) {
      errors.dueDate = 'Due date is required';
    }

    if (!createForm.paymentType) {
      errors.paymentType = 'Payment type is required';
    }

    setCreateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createPayment = async (event) => {
    event.preventDefault();

    if (!selectedProperty?.id) return;
    if (!validateCreateForm()) return;

    setSaving(true);
    setError('');

    try {
      const generatedPaymentId = `PAY-${Date.now().toString().slice(-8)}`;

      await apiService.payments.create({
        paymentId: createForm.paymentId.trim() || generatedPaymentId,
        tenantId: createForm.tenantId,
        propertyId: selectedProperty.id,
        amount: toNumber(createForm.amount),
        paymentType: createForm.paymentType,
        paymentMethod: createForm.paymentMethod,
        dueDate: createForm.dueDate,
        description: createForm.description.trim() || undefined,
        status: 'PENDING',
      });

      setShowCreateModal(false);
      setCreateForm({
        paymentId: '',
        tenantId: '',
        amount: '',
        paymentType: 'RENT',
        paymentMethod: 'UPI',
        dueDate: '',
        description: '',
      });
      setCreateErrors({});
      await loadPayments();
    } catch (err) {
      setError(err.message || 'Failed to create payment');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    const normalized = String(status || '').toUpperCase();
    const className =
      normalized === 'PAID'
        ? 'bg-green-100 text-green-800 border-green-200'
        : normalized === 'OVERDUE'
        ? 'bg-red-100 text-red-800 border-red-200'
        : normalized === 'PENDING'
        ? 'bg-amber-100 text-amber-800 border-amber-200'
        : 'bg-gray-100 text-gray-700 border-gray-200';

    return (
      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}>
        {normalized}
      </span>
    );
  };

  if (!selectedProperty) {
    return (
      <div className="space-y-6 p-6">
        <Card hover={false} className="border-gray-200 bg-white/85">
          <CardContent className="p-10 text-center text-gray-600">
            Select a property to manage payments.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage rent collection and dues for <span className="font-medium">{selectedProperty.name}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={loadPayments} loading={loading}>
            {!loading && <RefreshCw className="h-4 w-4" />}
            <span>Refresh</span>
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4" />
            <span>Add Payment</span>
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PaymentStatCard title="Total Payments" value={String(summary.totalPayments)} helper="Entries for selected filters" />
        <PaymentStatCard title="Collected" value={formatCurrency(summary.paidRevenue)} helper={`${summary.paidPayments} paid`} />
        <PaymentStatCard title="Pending" value={formatCurrency(summary.pendingRevenue)} helper={`${summary.pendingPayments} pending`} />
        <PaymentStatCard title="Overdue" value={String(summary.overduePayments)} helper="Immediate follow-up required" />
      </div>

      <Card hover={false} className="border-gray-200/80 bg-white/85 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
            <Input
              label="Search"
              placeholder="Payment ID / Tenant"
              value={filters.search}
              onChange={(event) => onFilterChange('search', event.target.value)}
            />

            <label className="flex flex-col gap-1 text-sm text-gray-700">
              <span className="text-sm font-medium">Status</span>
              <select
                value={filters.status}
                onChange={(event) => onFilterChange('status', event.target.value)}
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-700">
              <span className="text-sm font-medium">Type</span>
              <select
                value={filters.paymentType}
                onChange={(event) => onFilterChange('paymentType', event.target.value)}
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {PAYMENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <Input
              label="Month"
              placeholder="YYYY-MM"
              value={filters.month}
              onChange={(event) => onFilterChange('month', event.target.value)}
            />

            <Input
              label="Year"
              type="number"
              placeholder="2026"
              value={filters.year}
              onChange={(event) => onFilterChange('year', event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card hover={false} className="border-gray-200/80 bg-white/85 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" />
            Payment Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading payments...</span>
            </div>
          ) : payments.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-600">No payment records found for the selected filters.</p>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {payments.map((payment) => (
                  <div key={payment.id} className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{payment.paymentId}</p>
                        <p className="text-xs text-gray-500">{payment.paymentMethod?.replace('_', ' ') || 'NA'}</p>
                      </div>
                      {getStatusBadge(payment.status)}
                    </div>
                    <div className="mt-3 space-y-1.5 text-sm text-gray-700">
                      <p><span className="font-medium text-gray-900">Tenant:</span> {payment.tenant?.fullName || 'Unknown tenant'}</p>
                      <p><span className="font-medium text-gray-900">Type:</span> {String(payment.paymentType || '').replace(/_/g, ' ')}</p>
                      <p><span className="font-medium text-gray-900">Due:</span> {payment.dueDate ? formatDate(payment.dueDate) : '-'}</p>
                      <p><span className="font-medium text-gray-900">Amount:</span> {formatCurrency(toNumber(payment.amount))}</p>
                    </div>
                    <div className="mt-3">
                      {(payment.status === 'PENDING' || payment.status === 'OVERDUE' || payment.status === 'PARTIAL') ? (
                        <Button size="sm" variant="outline" className="w-full" onClick={() => markAsPaid(payment)}>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Mark Paid</span>
                        </Button>
                      ) : (
                        <p className="text-center text-xs text-gray-400">No action</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto rounded-2xl border border-gray-200/80 bg-white md:block">
                <table className="min-w-[760px] w-full text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100/70">
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-4 py-3">Payment</th>
                      <th className="px-4 py-3">Tenant</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Due Date</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="align-top">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{payment.paymentId}</p>
                          <p className="text-xs text-gray-500">{payment.paymentMethod?.replace('_', ' ') || 'NA'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{payment.tenant?.fullName || 'Unknown tenant'}</p>
                          <p className="text-xs text-gray-500">{payment.tenant?.tenantId || '-'}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{String(payment.paymentType || '').replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3 text-gray-700">{payment.dueDate ? formatDate(payment.dueDate) : '-'}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(toNumber(payment.amount))}</td>
                        <td className="px-4 py-3">{getStatusBadge(payment.status)}</td>
                        <td className="px-4 py-3 text-right">
                          {(payment.status === 'PENDING' || payment.status === 'OVERDUE' || payment.status === 'PARTIAL') ? (
                            <Button size="sm" variant="outline" onClick={() => markAsPaid(payment)}>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Mark Paid</span>
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400">No action</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Payment"
        description="Add a new payment entry for this property"
      >
        <form className="space-y-4" onSubmit={createPayment}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Payment ID (Optional)"
              placeholder="Auto-generated if empty"
              value={createForm.paymentId}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, paymentId: event.target.value }))}
            />

            <label className="flex flex-col gap-1 text-sm text-gray-700">
              <span className="text-sm font-medium">Tenant *</span>
              <select
                value={createForm.tenantId}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, tenantId: event.target.value }))}
                className={`h-10 rounded-lg border bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                  createErrors.tenantId ? 'border-red-400' : 'border-gray-200'
                }`}
              >
                <option value="">Select tenant</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.fullName} ({tenant.tenantId})
                  </option>
                ))}
              </select>
              {createErrors.tenantId && <span className="text-xs text-red-600">{createErrors.tenantId}</span>}
            </label>

            <Input
              label="Amount *"
              type="number"
              min="1"
              placeholder="0"
              value={createForm.amount}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, amount: event.target.value }))}
              error={createErrors.amount}
            />

            <Input
              label="Due Date *"
              type="date"
              value={createForm.dueDate}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, dueDate: event.target.value }))}
              error={createErrors.dueDate}
            />

            <label className="flex flex-col gap-1 text-sm text-gray-700">
              <span className="text-sm font-medium">Payment Type *</span>
              <select
                value={createForm.paymentType}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, paymentType: event.target.value }))}
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {PAYMENT_TYPE_OPTIONS.filter((option) => option.value).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-700">
              <span className="text-sm font-medium">Payment Method</span>
              <select
                value={createForm.paymentMethod}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, paymentMethod: event.target.value }))}
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {PAYMENT_METHOD_OPTIONS.map((method) => (
                  <option key={method} value={method}>
                    {method.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <Input
            label="Description"
            placeholder="Optional note for this payment"
            value={createForm.description}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              <span>Create Payment</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
