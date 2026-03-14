'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import apiService from '@/services/api';
import { addToast } from '@/store/slices/uiSlice';
import { Button, Dropdown, Input, Modal } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import {
  Bell,
  Building2,
  CircleAlert,
  Clock3,
  DoorOpen,
  Edit3,
  Eye,
  FileText,
  Loader2,
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Users,
} from 'lucide-react';

const NOTICE_TYPES = ['GENERAL', 'MAINTENANCE', 'PAYMENT_REMINDER', 'RULE_UPDATE', 'EVENT', 'EMERGENCY'];
const PRIORITY_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const AUDIENCE_OPTIONS = ['PROPERTY', 'FLOOR', 'ROOM', 'TENANT'];

const defaultForm = {
  title: '',
  content: '',
  noticeType: 'GENERAL',
  audienceType: 'PROPERTY',
  priority: 'MEDIUM',
  isPublished: true,
  expiryDate: '',
  targetFloorIds: [],
  targetRoomIds: [],
  targetTenantIds: [],
};

const metricToneClasses = {
  sky: 'border-sky-200/80 bg-[linear-gradient(180deg,rgba(240,249,255,0.96),rgba(255,255,255,0.92))] text-sky-700',
  emerald:
    'border-emerald-200/80 bg-[linear-gradient(180deg,rgba(236,253,245,0.96),rgba(255,255,255,0.92))] text-emerald-700',
  amber:
    'border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,251,235,0.96),rgba(255,255,255,0.92))] text-amber-700',
  rose: 'border-rose-200/80 bg-[linear-gradient(180deg,rgba(255,241,242,0.96),rgba(255,255,255,0.92))] text-rose-700',
};

const audienceMeta = {
  PROPERTY: {
    label: 'Entire property',
    icon: Building2,
    helper: 'Send to all active tenants in this property.',
  },
  FLOOR: {
    label: 'Specific floor',
    icon: Building2,
    helper: 'Choose one or more floors and send only to active tenants there.',
  },
  ROOM: {
    label: 'Specific room',
    icon: DoorOpen,
    helper: 'Choose one or more rooms and notify the active occupants only.',
  },
  TENANT: {
    label: 'Specific tenant',
    icon: Users,
    helper: 'Pick individual tenants for direct delivery.',
  },
};

const formatEnumLabel = (value) =>
  String(value || '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');

const getTodayDate = () => new Date().toISOString().slice(0, 10);

function NoticeMetricCard({ icon: Icon, label, value, helper, tone = 'sky' }) {
  return (
    <div
      className={`rounded-[1.5rem] border px-4 py-3.5 shadow-[0_12px_30px_rgba(15,23,42,0.04)] ${metricToneClasses[tone]}`}
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

function NoticeFormSection({ icon: Icon, title, children, tone = 'slate' }) {
  const toneClasses = {
    slate: 'border-slate-200/80 bg-white/90',
    sky: 'border-sky-200/80 bg-sky-50/70',
    amber: 'border-amber-200/80 bg-amber-50/70',
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

function PremiumTextarea({ label, value, onChange, placeholder, rows = 4, error, required = false, maxLength }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required ? <span className="ml-1 text-red-500">*</span> : null}
        </label>
        {maxLength ? (
          <span className="text-[11px] font-medium text-slate-400">
            {String(value || '').length}/{maxLength}
          </span>
        ) : null}
      </div>
      <textarea
        value={value}
        onChange={onChange}
        rows={rows}
        maxLength={maxLength}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm shadow-elegant transition-all duration-200 focus:outline-none ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/15'
            : 'border-gray-200 hover:border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15'
        }`}
        placeholder={placeholder}
      />
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

function PriorityBadge({ priority }) {
  const normalized = String(priority || '').toUpperCase();
  const classes =
    normalized === 'URGENT'
      ? 'border-rose-200/80 bg-rose-50 text-rose-700'
      : normalized === 'HIGH'
      ? 'border-amber-200/80 bg-amber-50 text-amber-700'
      : normalized === 'MEDIUM'
      ? 'border-sky-200/80 bg-sky-50 text-sky-700'
      : 'border-slate-200/80 bg-slate-50 text-slate-600';

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}>{formatEnumLabel(normalized)}</span>;
}

function PublishBadge({ isPublished }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
        isPublished
          ? 'border-emerald-200/80 bg-emerald-50 text-emerald-700'
          : 'border-slate-200/80 bg-slate-50 text-slate-600'
      }`}
    >
      {isPublished ? 'Published' : 'Draft'}
    </span>
  );
}

function NoticeCard({ notice, onEdit, onTogglePublish, onDelete, busyState }) {
  const AudienceIcon = audienceMeta[notice.audienceType]?.icon || Building2;
  const readRate = notice.stats?.readRate || 0;
  const totalTargets = notice.stats?.totalTargets || 0;
  const readCount = notice.stats?.readCount || 0;
  const isPublishing = busyState.id === notice.id && busyState.action === 'publish';
  const isDeleting = busyState.id === notice.id && busyState.action === 'delete';

  return (
    <article className="rounded-[1.75rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-slate-950">{notice.title}</h3>
              <PriorityBadge priority={notice.priority} />
              <PublishBadge isPublished={notice.isPublished} />
              <span className="inline-flex rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {formatEnumLabel(notice.noticeType)}
              </span>
            </div>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">{notice.content}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => onEdit(notice)} disabled={isPublishing || isDeleting}>
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit</span>
            </Button>
            <Button size="sm" variant="outline" onClick={() => onTogglePublish(notice)} loading={isPublishing} disabled={isDeleting}>
              {!isPublishing ? <Send className="h-3.5 w-3.5" /> : null}
              <span>{notice.isPublished ? 'Unpublish' : 'Publish'}</span>
            </Button>
            <Button size="sm" variant="outline" onClick={() => onDelete(notice)} loading={isDeleting} disabled={isPublishing}>
              {!isDeleting ? <Trash2 className="h-3.5 w-3.5" /> : null}
              <span>Delete</span>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[1.25rem] border border-slate-200/80 bg-slate-50/80 p-3.5">
            <div className="flex items-center gap-2">
              <AudienceIcon className="h-4 w-4 text-slate-500" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Audience</p>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-900">{notice.audience?.label || 'Entire property'}</p>
            <p className="mt-1 text-xs text-slate-500">{notice.audience?.subtitle || 'No audience details yet'}</p>
          </div>

          <div className="rounded-[1.25rem] border border-slate-200/80 bg-slate-50/80 p-3.5">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-slate-500" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Delivery</p>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {readCount}/{totalTargets} read
            </p>
            <div className="mt-2 h-2 rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-slate-900 transition-all" style={{ width: `${Math.min(readRate, 100)}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-500">{totalTargets ? `${readRate}% read rate` : 'Waiting for recipients'}</p>
          </div>

          <div className="rounded-[1.25rem] border border-slate-200/80 bg-slate-50/80 p-3.5">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-slate-500" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Schedule</p>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-900">Created {formatDate(notice.createdAt)}</p>
            <p className="mt-1 text-xs text-slate-500">
              {notice.expiryDate ? `Expires ${formatDate(notice.expiryDate)}` : 'No expiry set'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {notice.createdBy?.fullName ? `By ${notice.createdBy.fullName}` : 'Created from notices'}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function NoticesPage() {
  const dispatch = useDispatch();
  const { selectedProperty } = useSelector((state) => state.property);

  const [filters, setFilters] = useState({
    search: '',
    noticeType: '',
    priority: '',
    audienceType: '',
    isPublished: '',
  });
  const [searchValue, setSearchValue] = useState('');
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [formData, setFormData] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [busyState, setBusyState] = useState({ id: '', action: '' });
  const [loadingAudience, setLoadingAudience] = useState(false);
  const [audienceOptions, setAudienceOptions] = useState({
    floors: [],
    rooms: [],
    tenants: [],
  });

  const typeOptions = useMemo(
    () => NOTICE_TYPES.map((type) => ({ value: type, label: formatEnumLabel(type) })),
    []
  );
  const priorityOptions = useMemo(
    () => PRIORITY_LEVELS.map((priority) => ({ value: priority, label: formatEnumLabel(priority) })),
    []
  );
  const filterTypeOptions = useMemo(
    () => [{ value: '', label: 'All notice types' }, ...typeOptions],
    [typeOptions]
  );
  const filterPriorityOptions = useMemo(
    () => [{ value: '', label: 'All priorities' }, ...priorityOptions],
    [priorityOptions]
  );
  const filterAudienceOptions = useMemo(
    () => [
      { value: '', label: 'All audiences' },
      ...AUDIENCE_OPTIONS.map((type) => ({
        value: type,
        label: audienceMeta[type].label,
      })),
    ],
    []
  );
  const publishOptions = useMemo(
    () => [
      { value: '', label: 'All statuses' },
      { value: 'true', label: 'Published' },
      { value: 'false', label: 'Draft' },
    ],
    []
  );
  const audienceTypeOptions = useMemo(
    () =>
      AUDIENCE_OPTIONS.map((type) => ({
        value: type,
        label: audienceMeta[type].label,
        description: audienceMeta[type].helper,
      })),
    []
  );

  const floorOptions = useMemo(
    () =>
      audienceOptions.floors.map((floor) => ({
        value: floor.id,
        label: floor.name,
        description: `Floor ${floor.floorNumber}`,
      })),
    [audienceOptions.floors]
  );
  const roomOptions = useMemo(
    () =>
      audienceOptions.rooms.map((room) => ({
        value: room.id,
        label: `Room ${room.roomNumber}`,
        description: room.floor?.name || 'Room',
      })),
    [audienceOptions.rooms]
  );
  const tenantOptions = useMemo(
    () =>
      audienceOptions.tenants.map((tenant) => ({
        value: tenant.id,
        label: tenant.fullName,
        description: `${tenant.tenantId}${tenant.bed?.room?.roomNumber ? ` • Room ${tenant.bed.room.roomNumber}` : ''}`,
      })),
    [audienceOptions.tenants]
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setFilters((previous) => (previous.search === searchValue ? previous : { ...previous, search: searchValue.trim() }));
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchValue]);

  const loadNotices = useCallback(async () => {
    if (!selectedProperty?.id) {
      setNotices([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiService.notices.getAll(selectedProperty.id, {
        ...filters,
        limit: 100,
      });
      const payload = response.data?.notices || response.data || [];
      setNotices(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setError(err.message || 'Failed to load notices');
      setNotices([]);
    } finally {
      setLoading(false);
    }
  }, [filters, selectedProperty?.id]);

  const loadAudienceLists = useCallback(async () => {
    if (!selectedProperty?.id) {
      setAudienceOptions({ floors: [], rooms: [], tenants: [] });
      return;
    }

    setLoadingAudience(true);

    try {
      const [floorsResponse, roomsResponse, tenantsResponse] = await Promise.all([
        apiService.floors.getAll(selectedProperty.id),
        apiService.rooms.getAll({ propertyId: selectedProperty.id }),
        apiService.tenants.getAll({ propertyId: selectedProperty.id, status: 'ACTIVE' }),
      ]);

      setAudienceOptions({
        floors: Array.isArray(floorsResponse.data) ? floorsResponse.data : [],
        rooms: Array.isArray(roomsResponse.data) ? roomsResponse.data : [],
        tenants: Array.isArray(tenantsResponse.data) ? tenantsResponse.data : [],
      });
    } catch {
      setAudienceOptions({ floors: [], rooms: [], tenants: [] });
    } finally {
      setLoadingAudience(false);
    }
  }, [selectedProperty?.id]);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  useEffect(() => {
    if (showComposer) {
      loadAudienceLists();
    }
  }, [loadAudienceLists, showComposer]);

  useEffect(() => {
    if (!showComposer) {
      return;
    }

    if (formData.audienceType === 'PROPERTY') {
      setFormData((previous) => ({
        ...previous,
        targetFloorIds: [],
        targetRoomIds: [],
        targetTenantIds: [],
      }));
    }

    if (formData.audienceType === 'FLOOR') {
      setFormData((previous) => ({
        ...previous,
        targetRoomIds: [],
        targetTenantIds: [],
      }));
    }

    if (formData.audienceType === 'ROOM') {
      setFormData((previous) => ({
        ...previous,
        targetFloorIds: [],
        targetTenantIds: [],
      }));
    }

    if (formData.audienceType === 'TENANT') {
      setFormData((previous) => ({
        ...previous,
        targetFloorIds: [],
        targetRoomIds: [],
      }));
    }
  }, [formData.audienceType, showComposer]);

  const summary = useMemo(() => {
    const total = notices.length;
    const published = notices.filter((notice) => notice.isPublished).length;
    const drafts = notices.filter((notice) => !notice.isPublished).length;
    const urgent = notices.filter((notice) => notice.priority === 'URGENT').length;
    return { total, published, drafts, urgent };
  }, [notices]);

  const hasActiveFilters = Boolean(
    filters.search || filters.noticeType || filters.priority || filters.audienceType || filters.isPublished
  );

  const resetComposer = useCallback(() => {
    setEditingNotice(null);
    setFormData(defaultForm);
    setFormErrors({});
    setShowComposer(false);
  }, []);

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.title.trim()) {
      nextErrors.title = 'Title is required';
    }

    if (!formData.content.trim()) {
      nextErrors.content = 'Content is required';
    }

    if (formData.expiryDate && formData.expiryDate < getTodayDate()) {
      nextErrors.expiryDate = 'Use today or a future date';
    }

    if (formData.audienceType === 'FLOOR' && formData.targetFloorIds.length === 0) {
      nextErrors.targetFloorIds = 'Select at least one floor';
    }

    if (formData.audienceType === 'ROOM' && formData.targetRoomIds.length === 0) {
      nextErrors.targetRoomIds = 'Select at least one room';
    }

    if (formData.audienceType === 'TENANT' && formData.targetTenantIds.length === 0) {
      nextErrors.targetTenantIds = 'Select at least one tenant';
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const openCreateComposer = () => {
    setEditingNotice(null);
    setFormData(defaultForm);
    setFormErrors({});
    setShowComposer(true);
  };

  const openEditComposer = (notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title || '',
      content: notice.content || '',
      noticeType: notice.noticeType || 'GENERAL',
      audienceType: notice.audienceType || 'PROPERTY',
      priority: notice.priority || 'MEDIUM',
      isPublished: Boolean(notice.isPublished),
      expiryDate: notice.expiryDate ? String(notice.expiryDate).slice(0, 10) : '',
      targetFloorIds: Array.isArray(notice.targetFloorIds) ? notice.targetFloorIds : [],
      targetRoomIds: Array.isArray(notice.targetRoomIds) ? notice.targetRoomIds : [],
      targetTenantIds: Array.isArray(notice.targetTenants) ? notice.targetTenants.map((tenant) => tenant.id) : [],
    });
    setFormErrors({});
    setShowComposer(true);
  };

  const handleRefresh = async () => {
    await loadNotices();
    dispatch(
      addToast({
        title: 'Notices refreshed',
        description: 'The notice feed was refreshed for the selected property.',
        variant: 'success',
      })
    );
  };

  const handleComposerSubmit = async (event) => {
    event.preventDefault();

    if (!selectedProperty?.id || !validateForm()) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        noticeType: formData.noticeType,
        audienceType: formData.audienceType,
        priority: formData.priority,
        isPublished: formData.isPublished,
        expiryDate: formData.expiryDate || null,
        targetFloorIds: formData.audienceType === 'FLOOR' ? formData.targetFloorIds : [],
        targetRoomIds: formData.audienceType === 'ROOM' ? formData.targetRoomIds : [],
        targetTenantIds: formData.audienceType === 'TENANT' ? formData.targetTenantIds : [],
      };

      if (editingNotice?.id) {
        await apiService.notices.update(selectedProperty.id, editingNotice.id, payload);
      } else {
        await apiService.notices.create(selectedProperty.id, payload);
      }

      await loadNotices();
      resetComposer();
      dispatch(
        addToast({
          title: editingNotice ? 'Notice updated' : 'Notice created',
          description: editingNotice
            ? 'Your notice changes were saved.'
            : formData.isPublished
            ? 'The notice was published to the selected audience.'
            : 'The notice was saved as a draft.',
          variant: 'success',
        })
      );
    } catch (err) {
      setError(err.message || 'Failed to save notice');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (notice) => {
    if (!selectedProperty?.id || !notice?.id) return;

    setBusyState({ id: notice.id, action: 'publish' });
    setError('');

    try {
      await apiService.notices.update(selectedProperty.id, notice.id, {
        isPublished: !notice.isPublished,
        publishDate: !notice.isPublished ? new Date().toISOString() : null,
      });

      await loadNotices();
      dispatch(
        addToast({
          title: notice.isPublished ? 'Notice unpublished' : 'Notice published',
          description: notice.isPublished
            ? 'The notice was moved back to draft.'
            : 'The notice is now live for the selected audience.',
          variant: 'success',
        })
      );
    } catch (err) {
      setError(err.message || 'Failed to update notice');
    } finally {
      setBusyState({ id: '', action: '' });
    }
  };

  const handleDelete = async (notice) => {
    if (!selectedProperty?.id || !notice?.id) return;

    const confirmed = window.confirm(`Delete "${notice.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setBusyState({ id: notice.id, action: 'delete' });
    setError('');

    try {
      await apiService.notices.delete(selectedProperty.id, notice.id);
      await loadNotices();
      dispatch(
        addToast({
          title: 'Notice deleted',
          description: 'The notice was removed from this property.',
          variant: 'success',
        })
      );
    } catch (err) {
      setError(err.message || 'Failed to delete notice');
    } finally {
      setBusyState({ id: '', action: '' });
    }
  };

  const selectedAudienceMeta = audienceMeta[formData.audienceType] || audienceMeta.PROPERTY;
  const AudienceIcon = selectedAudienceMeta.icon;

  if (!selectedProperty) {
    return (
      <div className="app-shell min-h-screen space-y-6 p-4 sm:p-6">
        <section className="app-surface rounded-[2rem] p-10 text-center">
          <p className="text-sm text-slate-500">Select a property in the header to manage notices.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen space-y-6 p-4 sm:p-6">
      <section className="app-surface rounded-[2rem] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Notices</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleRefresh} loading={loading}>
              {!loading ? <RefreshCw className="h-4 w-4" /> : null}
              <span>Refresh</span>
            </Button>
            <Button onClick={openCreateComposer}>
              <Plus className="h-4 w-4" />
              <span>New notice</span>
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <NoticeMetricCard
            icon={Megaphone}
            label="Total notices"
            value={summary.total}
            helper="All notices for this property."
            tone="sky"
          />
          <NoticeMetricCard
            icon={Send}
            label="Published"
            value={summary.published}
            helper="Live notices sent to recipients."
            tone="emerald"
          />
          <NoticeMetricCard
            icon={FileText}
            label="Drafts"
            value={summary.drafts}
            helper="Saved as drafts."
            tone="amber"
          />
          <NoticeMetricCard
            icon={Bell}
            label="Urgent"
            value={summary.urgent}
            helper="Urgent priority notices."
            tone="rose"
          />
        </div>
      </section>

      <section className="app-surface rounded-[2rem] p-4 shadow-[0_16px_36px_rgba(15,23,42,0.05)] sm:p-5">
        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Input
            premium
            label="Search"
            placeholder="Search title or message"
            icon={Search}
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />

          <Dropdown
            premium
            label="Type"
            options={filterTypeOptions}
            value={filters.noticeType}
            onChange={(value) => setFilters((previous) => ({ ...previous, noticeType: value }))}
            placeholder="All types"
          />

          <Dropdown
            premium
            label="Priority"
            options={filterPriorityOptions}
            value={filters.priority}
            onChange={(value) => setFilters((previous) => ({ ...previous, priority: value }))}
            placeholder="All priorities"
          />

          <Dropdown
            premium
            label="Audience"
            options={filterAudienceOptions}
            value={filters.audienceType}
            onChange={(value) => setFilters((previous) => ({ ...previous, audienceType: value }))}
            placeholder="All audiences"
          />

          <Dropdown
            premium
            label="Status"
            options={publishOptions}
            value={filters.isPublished}
            onChange={(value) => setFilters((previous) => ({ ...previous, isPublished: value }))}
            placeholder="All statuses"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
          {hasActiveFilters ? (
            <Button
              variant="ghost"
              onClick={() => {
                setSearchValue('');
                setFilters({
                  search: '',
                  noticeType: '',
                  priority: '',
                  audienceType: '',
                  isPublished: '',
                });
              }}
            >
              <span>Clear filters</span>
            </Button>
          ) : null}
        </div>
      </section>

      {error ? (
        <section className="rounded-[1.5rem] border border-rose-200/80 bg-rose-50/80 px-4 py-3.5 text-sm text-rose-700 shadow-[0_12px_28px_rgba(244,63,94,0.08)]">
          <div className="flex items-center gap-2">
            <CircleAlert className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        {loading ? (
          <section className="app-surface rounded-[2rem] px-6 py-14 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white">
              <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
            </div>
            <p className="mt-4 text-sm text-slate-500">Loading notices for the selected property...</p>
          </section>
        ) : notices.length === 0 ? (
          <section className="app-surface rounded-[2rem] px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[1.25rem] border border-slate-200/80 bg-white/90">
              <Megaphone className="h-5 w-5 text-slate-500" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-950">No notices yet</h3>
            <p className="mt-2 text-sm text-slate-500">Create your first notice to send updates to this property.</p>
            <div className="mt-5">
              <Button onClick={openCreateComposer}>
                <Plus className="h-4 w-4" />
                <span>Create notice</span>
              </Button>
            </div>
          </section>
        ) : (
          notices.map((notice) => (
            <NoticeCard
              key={notice.id}
              notice={notice}
              onEdit={openEditComposer}
              onTogglePublish={handleTogglePublish}
              onDelete={handleDelete}
              busyState={busyState}
            />
          ))
        )}
      </section>

      <Modal
        isOpen={showComposer}
        onClose={resetComposer}
        title={editingNotice ? 'Edit notice' : 'New notice'}
        size="lg"
      >
        <form className="space-y-4" onSubmit={handleComposerSubmit}>
          <NoticeFormSection icon={Megaphone} title="Notice details">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Input
                  premium
                  label="Title"
                  placeholder="Enter notice title"
                  value={formData.title}
                  onChange={(event) => {
                    setFormData((previous) => ({ ...previous, title: event.target.value }));
                    setFormErrors((previous) => ({ ...previous, title: undefined }));
                  }}
                  error={formErrors.title}
                  required
                />
              </div>

              <Dropdown
                premium
                label="Notice type"
                options={typeOptions}
                value={formData.noticeType}
                onChange={(value) => setFormData((previous) => ({ ...previous, noticeType: value }))}
              />

              <Dropdown
                premium
                label="Priority"
                options={priorityOptions}
                value={formData.priority}
                onChange={(value) => setFormData((previous) => ({ ...previous, priority: value }))}
              />

              <div className="md:col-span-2">
                <PremiumTextarea
                  label="Message"
                  value={formData.content}
                  onChange={(event) => {
                    setFormData((previous) => ({ ...previous, content: event.target.value }));
                    setFormErrors((previous) => ({ ...previous, content: undefined }));
                  }}
                  placeholder="Write the notice clearly so the audience knows what action to take."
                  rows={5}
                  maxLength={1200}
                  error={formErrors.content}
                  required
                />
              </div>
            </div>
          </NoticeFormSection>

          <NoticeFormSection icon={AudienceIcon} title="Audience and delivery" tone="sky">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Dropdown
                  premium
                  label="Audience"
                  options={audienceTypeOptions}
                  value={formData.audienceType}
                  onChange={(value) => {
                    setFormData((previous) => ({ ...previous, audienceType: value }));
                    setFormErrors((previous) => ({
                      ...previous,
                      targetFloorIds: undefined,
                      targetRoomIds: undefined,
                      targetTenantIds: undefined,
                    }));
                  }}
                />
                <p className="mt-2 text-xs text-slate-500">{selectedAudienceMeta.helper}</p>
              </div>

              {formData.audienceType === 'FLOOR' ? (
                <div className="md:col-span-2">
                  <Dropdown
                    premium
                    multiple
                    searchable
                    label="Floors"
                    options={floorOptions}
                    value={formData.targetFloorIds}
                    onChange={(value) => {
                      setFormData((previous) => ({ ...previous, targetFloorIds: value }));
                      setFormErrors((previous) => ({ ...previous, targetFloorIds: undefined }));
                    }}
                    placeholder={loadingAudience ? 'Loading floors...' : 'Select one or more floors'}
                    disabled={loadingAudience}
                    error={formErrors.targetFloorIds}
                  />
                </div>
              ) : null}

              {formData.audienceType === 'ROOM' ? (
                <div className="md:col-span-2">
                  <Dropdown
                    premium
                    multiple
                    searchable
                    label="Rooms"
                    options={roomOptions}
                    value={formData.targetRoomIds}
                    onChange={(value) => {
                      setFormData((previous) => ({ ...previous, targetRoomIds: value }));
                      setFormErrors((previous) => ({ ...previous, targetRoomIds: undefined }));
                    }}
                    placeholder={loadingAudience ? 'Loading rooms...' : 'Select one or more rooms'}
                    disabled={loadingAudience}
                    error={formErrors.targetRoomIds}
                  />
                </div>
              ) : null}

              {formData.audienceType === 'TENANT' ? (
                <div className="md:col-span-2">
                  <Dropdown
                    premium
                    multiple
                    searchable
                    label="Tenants"
                    options={tenantOptions}
                    value={formData.targetTenantIds}
                    onChange={(value) => {
                      setFormData((previous) => ({ ...previous, targetTenantIds: value }));
                      setFormErrors((previous) => ({ ...previous, targetTenantIds: undefined }));
                    }}
                    placeholder={loadingAudience ? 'Loading tenants...' : 'Search and select tenants'}
                    disabled={loadingAudience}
                    error={formErrors.targetTenantIds}
                  />
                </div>
              ) : null}
            </div>
          </NoticeFormSection>

          <NoticeFormSection icon={Clock3} title="Publishing" tone="amber">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                premium
                label="Expiry date"
                type="date"
                min={getTodayDate()}
                value={formData.expiryDate}
                onChange={(event) => {
                  setFormData((previous) => ({ ...previous, expiryDate: event.target.value }));
                  setFormErrors((previous) => ({ ...previous, expiryDate: undefined }));
                }}
                error={formErrors.expiryDate}
              />

              <div className="flex flex-col justify-end rounded-[1.25rem] border border-slate-200/80 bg-white/90 px-4 py-3">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(event) => setFormData((previous) => ({ ...previous, isPublished: event.target.checked }))}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/20"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-900">Publish immediately</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Turn this off if you want to save the notice as a draft first.
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </NoticeFormSection>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={resetComposer} disabled={saving}>
              <span>Cancel</span>
            </Button>
            <Button type="submit" loading={saving}>
              <span>{editingNotice ? 'Save notice' : 'Create notice'}</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
