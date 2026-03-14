'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import apiService from '@/services/api';
import { addToast } from '@/store/slices/uiSlice';
import { Button, Dropdown, Input, Modal } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  CheckCircle2,
  CircleAlert,
  CreditCard,
  Plus,
  RefreshCw,
  Search,
  User,
  WalletCards,
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

const DEFAULT_CREATE_FORM = {
  paymentId: '',
  tenantId: '',
  amount: '',
  paymentType: 'RENT',
  paymentMethod: 'UPI',
  dueDate: '',
  description: '',
};

const PAYMENT_METRIC_STYLES = {
  sky: 'border-sky-200/80 bg-[linear-gradient(180deg,rgba(240,249,255,0.96),rgba(255,255,255,0.92))] text-sky-700',
  emerald: 'border-emerald-200/80 bg-[linear-gradient(180deg,rgba(236,253,245,0.96),rgba(255,255,255,0.92))] text-emerald-700',
  amber: 'border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,251,235,0.96),rgba(255,255,255,0.92))] text-amber-700',
  rose: 'border-rose-200/80 bg-[linear-gradient(180deg,rgba(255,241,242,0.96),rgba(255,255,255,0.92))] text-rose-700',
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatEnumLabel = (value) =>
  String(value || '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');

const canMarkPaid = (status) => ['PENDING', 'OVERDUE', 'PARTIAL'].includes(String(status || '').toUpperCase());

function PaymentMetricCard({ icon: Icon, label, value, helper, tone = 'sky' }) {
  return (
    <div
      className={`rounded-[1.5rem] border px-4 py-3.5 shadow-[0_12px_30px_rgba(15,23,42,0.04)] ${PAYMENT_METRIC_STYLES[tone]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-1.5 text-[1.8rem] font-semibold tracking-tight text-slate-950">{value}</p>
          {helper ? <p className="mt-1.5 text-xs text-slate-500">{helper}</p> : null}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-[1.1rem] border border-white/70 bg-white/80">
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
    </div>
  );
}

function PaymentFormSection({ icon: Icon, title, children, tone = 'slate' }) {
  const toneClasses = {
    slate: 'border-slate-200/80 bg-white/90',
    sky: 'border-sky-200/80 bg-sky-50/70',
  };

  return (
    <section
      className={`overflow-visible rounded-[1.5rem] border p-4 shadow-[0_12px_32px_rgba(15,23,42,0.04)] sm:p-5 ${toneClasses[tone]}`}
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-slate-700">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="flex min-h-10 items-center">
          <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        </div>
      </div>
      {children}
    </section>
  );
}

function PaymentStatusBadge({ status }) {
  const normalized = String(status || '').toUpperCase();
  const className =
    normalized === 'PAID'
      ? 'border-emerald-200/80 bg-emerald-50 text-emerald-700'
      : normalized === 'OVERDUE'
      ? 'border-rose-200/80 bg-rose-50 text-rose-700'
      : normalized === 'PENDING'
      ? 'border-amber-200/80 bg-amber-50 text-amber-700'
      : normalized === 'PARTIAL'
      ? 'border-sky-200/80 bg-sky-50 text-sky-700'
      : 'border-slate-200/80 bg-slate-50 text-slate-600';

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>
      {formatEnumLabel(normalized)}
    </span>
  );
}

function PaymentsPageSkeleton() {
  return (
    <section className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 px-6 py-14 text-center shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
      <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
      <p className="mt-4 text-sm text-slate-500">Loading payment records for the selected property...</p>
    </section>
  );
}

export default function PaymentsPage() {
  const dispatch = useDispatch();
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
  const [markingPaymentId, setMarkingPaymentId] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(DEFAULT_CREATE_FORM);
  const [createErrors, setCreateErrors] = useState({});

  const statusDropdownOptions = useMemo(
    () => STATUS_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
    []
  );
  const paymentTypeDropdownOptions = useMemo(
    () => PAYMENT_TYPE_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
    []
  );
  const paymentMethodDropdownOptions = useMemo(
    () => PAYMENT_METHOD_OPTIONS.map((method) => ({
      value: method,
      label: formatEnumLabel(method),
    })),
    []
  );

  const tenantOptions = useMemo(
    () =>
      tenants.map((tenant) => ({
        value: tenant.id,
        label: tenant.fullName,
        description: `${tenant.tenantId}${tenant.bed?.room?.roomNumber ? ` • Room ${tenant.bed.room.roomNumber}` : ''}`,
      })),
    [tenants]
  );

  const loadPayments = useCallback(async () => {
    if (!selectedProperty?.id) {
      setPayments([]);
      setStats(null);
      return;
    }

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
  }, [filters.month, filters.paymentType, filters.search, filters.status, filters.year, selectedProperty?.id]);

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

  const hasActiveFilters = Boolean(filters.status || filters.paymentType || filters.search || filters.month);

  const updateFilter = (key, value) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      paymentType: '',
      search: '',
      month: '',
      year: String(new Date().getFullYear()),
    });
  };

  const updateCreateField = (field, value) => {
    setCreateForm((previous) => ({ ...previous, [field]: value }));
    setCreateErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCreateForm(DEFAULT_CREATE_FORM);
    setCreateErrors({});
  };

  const markAsPaid = async (payment) => {
    if (!payment?.id || !canMarkPaid(payment.status)) return;

    setMarkingPaymentId(payment.id);

    try {
      await apiService.payments.markPaid(payment.id, {
        paymentMethod: payment.paymentMethod || 'UPI',
        paidDate: new Date().toISOString(),
      });

      await loadPayments();
      dispatch(
        addToast({
          title: 'Payment updated',
          description: `${payment.paymentId} was marked as paid.`,
          variant: 'success',
        })
      );
    } catch (err) {
      const message = err.message || 'Failed to mark payment as paid';
      setError(message);
      dispatch(
        addToast({
          title: 'Update failed',
          description: message,
          variant: 'error',
        })
      );
    } finally {
      setMarkingPaymentId('');
    }
  };

  const validateCreateForm = () => {
    const errors = {};

    if (!createForm.tenantId) {
      errors.tenantId = 'Tenant is required.';
    }

    if (!createForm.amount || toNumber(createForm.amount) <= 0) {
      errors.amount = 'Enter a valid amount.';
    }

    if (!createForm.dueDate) {
      errors.dueDate = 'Due date is required.';
    }

    if (!createForm.paymentType) {
      errors.paymentType = 'Payment type is required.';
    }

    setCreateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createPayment = async (event) => {
    event.preventDefault();

    if (!selectedProperty?.id) return;
    if (!validateCreateForm()) {
      dispatch(
        addToast({
          title: 'Complete required fields',
          description: 'Review the highlighted payment details before saving.',
          variant: 'warning',
        })
      );
      return;
    }

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

      dispatch(
        addToast({
          title: 'Payment added',
          description: 'The payment entry was created successfully.',
          variant: 'success',
        })
      );

      handleCloseCreateModal();
      await loadPayments();
    } catch (err) {
      const message = err.message || 'Failed to create payment';
      setError(message);
      dispatch(
        addToast({
          title: 'Create failed',
          description: message,
          variant: 'error',
        })
      );
    } finally {
      setSaving(false);
    }
  };

  if (!selectedProperty) {
    return (
      <div className="app-shell min-h-screen space-y-6 p-4 sm:p-6">
        <section className="app-surface rounded-[2rem] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.35rem] border border-slate-200/80 bg-slate-50 text-slate-500">
            <CreditCard className="h-6 w-6" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-slate-900">No property selected</h3>
          <p className="mt-2 text-sm text-slate-500">
            Choose a property from the header first, then the payment records and collection actions will load here.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen space-y-6 p-4 sm:p-6">
      <section className="app-surface rounded-[2rem] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Payments</h1>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <Button variant="outline" onClick={loadPayments} loading={loading}>
              {!loading && <RefreshCw className="h-4 w-4" />}
              <span>Refresh</span>
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" />
              <span>Add payment</span>
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <PaymentMetricCard
            icon={CreditCard}
            label="Total entries"
            value={String(summary.totalPayments)}
            helper="Payment records for current filters"
            tone="sky"
          />
          <PaymentMetricCard
            icon={CheckCircle2}
            label="Collected"
            value={formatCurrency(summary.paidRevenue)}
            helper={`${summary.paidPayments} paid`}
            tone="emerald"
          />
          <PaymentMetricCard
            icon={WalletCards}
            label="Pending due"
            value={formatCurrency(summary.pendingRevenue)}
            helper={`${summary.pendingPayments} still open`}
            tone="amber"
          />
          <PaymentMetricCard
            icon={CircleAlert}
            label="Overdue"
            value={String(summary.overduePayments)}
            helper="Needs immediate follow-up"
            tone="rose"
          />
        </div>
      </section>

      {error ? (
        <section className="rounded-[1.75rem] border border-rose-200/80 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-2">
            <CircleAlert className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </section>
      ) : null}

      <section className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)] backdrop-blur sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.75fr)_auto]">
          <Input
            premium
            icon={Search}
            label="Search"
            placeholder="Payment ID or tenant"
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
            autoComplete="off"
            spellCheck={false}
            name="payments-record-search"
          />

          <Dropdown
            premium
            label="Status"
            options={statusDropdownOptions}
            value={filters.status}
            onChange={(value) => updateFilter('status', value)}
            placeholder="All statuses"
          />

          <Dropdown
            premium
            label="Type"
            options={paymentTypeDropdownOptions}
            value={filters.paymentType}
            onChange={(value) => updateFilter('paymentType', value)}
            placeholder="All types"
          />

          <Input
            premium
            label="Month"
            type="month"
            value={filters.month}
            onChange={(event) => updateFilter('month', event.target.value)}
          />

          <Input
            premium
            label="Year"
            type="number"
            value={filters.year}
            onChange={(event) => updateFilter('year', event.target.value)}
            min="2020"
            max="2100"
            placeholder="2026"
          />

          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="w-full"
            >
              <span>Clear</span>
            </Button>
          </div>
        </div>
      </section>

      {loading ? (
        <PaymentsPageSkeleton />
      ) : (
        <section className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] border border-sky-200/80 bg-sky-100/80 text-sky-700 shadow-[0_10px_20px_rgba(56,189,248,0.12)]">
                <CreditCard className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Payment records</h2>
                <p className="text-sm text-slate-500">{payments.length} matching entries</p>
              </div>
            </div>
          </div>

          {payments.length === 0 ? (
            <div className="rounded-[1.35rem] border border-dashed border-slate-200/80 bg-slate-50/50 px-6 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[1rem] border border-slate-200/80 bg-white text-slate-500">
                <CreditCard className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">No payment records found</h3>
              <p className="mt-2 text-sm text-slate-500">Adjust your filters or create a new payment entry for this property.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-[1.5rem] border border-slate-200/80 bg-white/92 p-4 shadow-[0_14px_32px_rgba(15,23,42,0.04)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{payment.paymentId}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatEnumLabel(payment.paymentMethod) || 'NA'}</p>
                      </div>
                      <PaymentStatusBadge status={payment.status} />
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Tenant</p>
                        <p className="mt-1 text-sm font-medium text-slate-900">{payment.tenant?.fullName || 'Unknown tenant'}</p>
                        <p className="mt-1 text-xs text-slate-500">{payment.tenant?.tenantId || '-'}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Type</p>
                        <p className="mt-1 text-sm font-medium text-slate-900">{formatEnumLabel(payment.paymentType)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Due</p>
                        <p className="mt-1 text-sm font-medium text-slate-900">{payment.dueDate ? formatDate(payment.dueDate) : '-'}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Amount</p>
                        <p className="mt-1 text-sm font-medium text-slate-900">{formatCurrency(toNumber(payment.amount))}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      {canMarkPaid(payment.status) ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-emerald-200/80 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800"
                          onClick={() => markAsPaid(payment)}
                          loading={markingPaymentId === payment.id}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Mark paid</span>
                        </Button>
                      ) : (
                        <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-center text-xs font-medium text-slate-500">
                          No action required
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.94))] shadow-[0_18px_40px_rgba(15,23,42,0.05)] md:block">
                <div className="overflow-x-auto">
                  <table className="min-w-[860px] w-full text-sm">
                    <thead className="bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.96))]">
                      <tr>
                        <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Payment</th>
                        <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Tenant</th>
                        <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Type</th>
                        <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Due date</th>
                        <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Amount</th>
                        <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Status</th>
                        <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70">
                      {payments.map((payment, index) => (
                        <tr
                          key={payment.id}
                          className={`${index % 2 === 0 ? 'bg-white/95' : 'bg-slate-50/35'} align-top transition-colors hover:bg-sky-50/45`}
                        >
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-950">{payment.paymentId}</p>
                            <p className="mt-1 text-xs text-slate-500">{formatEnumLabel(payment.paymentMethod) || 'NA'}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-950">{payment.tenant?.fullName || 'Unknown tenant'}</p>
                            <p className="mt-1 text-xs text-slate-500">{payment.tenant?.tenantId || '-'}</p>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-700">{formatEnumLabel(payment.paymentType)}</td>
                          <td className="px-5 py-4 text-sm text-slate-700">{payment.dueDate ? formatDate(payment.dueDate) : '-'}</td>
                          <td className="px-5 py-4 text-sm font-semibold text-slate-950">{formatCurrency(toNumber(payment.amount))}</td>
                          <td className="px-5 py-4">
                            <PaymentStatusBadge status={payment.status} />
                          </td>
                          <td className="px-5 py-4 text-right">
                            {canMarkPaid(payment.status) ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-emerald-200/80 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800"
                                onClick={() => markAsPaid(payment)}
                                loading={markingPaymentId === payment.id}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Mark paid</span>
                              </Button>
                            ) : (
                              <span className="text-xs font-medium text-slate-400">No action</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      <Modal isOpen={showCreateModal} onClose={handleCloseCreateModal} title="Add payment" size="lg">
        <form className="space-y-5" onSubmit={createPayment}>
          <div className="max-h-[72vh] space-y-5 overflow-y-auto pr-1">
            <PaymentFormSection icon={User} title="Tenant and payment type">
              <div className="grid gap-4 md:grid-cols-2">
                <Dropdown
                  premium
                  searchable
                  label="Tenant"
                  options={tenantOptions}
                  value={createForm.tenantId}
                  onChange={(value) => updateCreateField('tenantId', value)}
                  placeholder={tenantOptions.length ? 'Select active tenant' : 'No active tenants'}
                  error={createErrors.tenantId}
                  disabled={!tenantOptions.length}
                />

                <Dropdown
                  premium
                  label="Payment Type"
                  options={paymentTypeDropdownOptions.filter((option) => option.value)}
                  value={createForm.paymentType}
                  onChange={(value) => updateCreateField('paymentType', value)}
                  error={createErrors.paymentType}
                />

                <Dropdown
                  premium
                  label="Payment Method"
                  options={paymentMethodDropdownOptions}
                  value={createForm.paymentMethod}
                  onChange={(value) => updateCreateField('paymentMethod', value)}
                />

                <Input
                  premium
                  label="Payment ID"
                  placeholder="Auto-generated if empty"
                  value={createForm.paymentId}
                  onChange={(event) => updateCreateField('paymentId', event.target.value)}
                />
              </div>
            </PaymentFormSection>

            <PaymentFormSection icon={WalletCards} title="Amount and schedule" tone="sky">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  premium
                  label="Amount"
                  type="number"
                  min="1"
                  placeholder="0"
                  value={createForm.amount}
                  onChange={(event) => updateCreateField('amount', event.target.value)}
                  error={createErrors.amount}
                />

                <Input
                  premium
                  label="Due date"
                  type="date"
                  value={createForm.dueDate}
                  onChange={(event) => updateCreateField('dueDate', event.target.value)}
                  error={createErrors.dueDate}
                />
              </div>

              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={3}
                  value={createForm.description}
                  onChange={(event) => updateCreateField('description', event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-elegant transition-all duration-200 hover:border-gray-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/15"
                  placeholder="Optional note for this payment"
                />
              </div>
            </PaymentFormSection>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200/80 pt-4">
            <Button variant="outline" onClick={handleCloseCreateModal}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              <span>Create payment</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
