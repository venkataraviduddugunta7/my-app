'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import apiService from '@/services/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Modal } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import {
  Bell,
  CircleAlert,
  Loader2,
  Megaphone,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';

const NOTICE_TYPES = ['GENERAL', 'MAINTENANCE', 'PAYMENT_REMINDER', 'RULE_UPDATE', 'EVENT', 'EMERGENCY'];
const PRIORITY_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const defaultForm = {
  title: '',
  content: '',
  noticeType: 'GENERAL',
  priority: 'MEDIUM',
  isPublished: true,
  expiryDate: '',
};

export default function NoticesPage() {
  const { selectedProperty } = useSelector((state) => state.property);

  const [filters, setFilters] = useState({
    search: '',
    noticeType: '',
    priority: '',
    isPublished: '',
  });

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const loadNotices = useCallback(async () => {
    if (!selectedProperty?.id) return;

    setLoading(true);
    setError('');

    try {
      const response = await apiService.notices.getAll(selectedProperty.id, {
        search: filters.search,
        noticeType: filters.noticeType,
        priority: filters.priority,
        isPublished: filters.isPublished,
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
  }, [filters.isPublished, filters.noticeType, filters.priority, filters.search, selectedProperty?.id]);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  const stats = useMemo(() => {
    const total = notices.length;
    const published = notices.filter((notice) => notice.isPublished).length;
    const urgent = notices.filter((notice) => notice.priority === 'URGENT').length;
    const active = notices.filter((notice) => !notice.expiryDate || new Date(notice.expiryDate) >= new Date()).length;

    return { total, published, urgent, active };
  }, [notices]);

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.content.trim()) {
      errors.content = 'Content is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createNotice = async (event) => {
    event.preventDefault();

    if (!selectedProperty?.id) return;
    if (!validateForm()) return;

    setSaving(true);
    setError('');

    try {
      await apiService.notices.create(selectedProperty.id, {
        title: formData.title.trim(),
        content: formData.content.trim(),
        noticeType: formData.noticeType,
        priority: formData.priority,
        isPublished: formData.isPublished,
        publishDate: formData.isPublished ? new Date().toISOString() : null,
        expiryDate: formData.expiryDate || null,
      });

      setFormData(defaultForm);
      setFormErrors({});
      setShowCreateModal(false);
      await loadNotices();
    } catch (err) {
      setError(err.message || 'Failed to create notice');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (notice) => {
    if (!selectedProperty?.id) return;

    try {
      await apiService.notices.update(selectedProperty.id, notice.id, {
        isPublished: !notice.isPublished,
        publishDate: !notice.isPublished ? new Date().toISOString() : null,
      });
      await loadNotices();
    } catch (err) {
      setError(err.message || 'Failed to update notice status');
    }
  };

  const removeNotice = async (noticeId) => {
    if (!selectedProperty?.id) return;

    const confirmed = window.confirm('Delete this notice? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await apiService.notices.delete(selectedProperty.id, noticeId);
      await loadNotices();
    } catch (err) {
      setError(err.message || 'Failed to delete notice');
    }
  };

  const priorityBadge = (priority) => {
    const normalized = String(priority || '').toUpperCase();
    const className =
      normalized === 'URGENT'
        ? 'bg-red-100 text-red-800 border-red-200'
        : normalized === 'HIGH'
        ? 'bg-amber-100 text-amber-800 border-amber-200'
        : normalized === 'MEDIUM'
        ? 'bg-blue-100 text-blue-800 border-blue-200'
        : 'bg-gray-100 text-gray-700 border-gray-200';

    return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}>{normalized}</span>;
  };

  if (!selectedProperty) {
    return (
      <div className="space-y-6 p-6">
        <Card hover={false} className="border-gray-200 bg-white/85">
          <CardContent className="p-10 text-center text-gray-600">Select a property to manage notices.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Notices</h1>
          <p className="mt-1 text-sm text-gray-600">
            Broadcast updates and policy changes for <span className="font-medium">{selectedProperty.name}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={loadNotices} loading={loading}>
            {!loading && <RefreshCw className="h-4 w-4" />}
            <span>Refresh</span>
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4" />
            <span>New Notice</span>
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
        <Card hover={false} className="border-gray-200/80 bg-white/85 shadow-sm"><CardContent className="p-5"><p className="text-sm text-gray-600">Total</p><p className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</p></CardContent></Card>
        <Card hover={false} className="border-gray-200/80 bg-white/85 shadow-sm"><CardContent className="p-5"><p className="text-sm text-gray-600">Published</p><p className="mt-1 text-2xl font-semibold text-gray-900">{stats.published}</p></CardContent></Card>
        <Card hover={false} className="border-gray-200/80 bg-white/85 shadow-sm"><CardContent className="p-5"><p className="text-sm text-gray-600">Urgent</p><p className="mt-1 text-2xl font-semibold text-gray-900">{stats.urgent}</p></CardContent></Card>
        <Card hover={false} className="border-gray-200/80 bg-white/85 shadow-sm"><CardContent className="p-5"><p className="text-sm text-gray-600">Active</p><p className="mt-1 text-2xl font-semibold text-gray-900">{stats.active}</p></CardContent></Card>
      </div>

      <Card hover={false} className="border-gray-200/80 bg-white/85 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Search"
              placeholder="Title or content"
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            />

            <label className="flex flex-col gap-1 text-sm text-gray-700">
              <span className="text-sm font-medium">Notice Type</span>
              <select
                value={filters.noticeType}
                onChange={(event) => setFilters((prev) => ({ ...prev, noticeType: event.target.value }))}
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">All types</option>
                {NOTICE_TYPES.map((type) => (
                  <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-700">
              <span className="text-sm font-medium">Priority</span>
              <select
                value={filters.priority}
                onChange={(event) => setFilters((prev) => ({ ...prev, priority: event.target.value }))}
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">All priorities</option>
                {PRIORITY_LEVELS.map((priority) => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-700">
              <span className="text-sm font-medium">Publish Status</span>
              <select
                value={filters.isPublished}
                onChange={(event) => setFilters((prev) => ({ ...prev, isPublished: event.target.value }))}
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">All</option>
                <option value="true">Published</option>
                <option value="false">Draft</option>
              </select>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card hover={false} className="border-gray-200/80 bg-white/85 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" />
            Notice Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading notices...</span>
            </div>
          ) : notices.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-600">No notices found for the current filters.</p>
          ) : (
            <div className="space-y-3">
              {notices.map((notice) => (
                <div key={notice.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900">{notice.title}</h3>
                        {priorityBadge(notice.priority)}
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${notice.isPublished ? 'border-green-200 bg-green-100 text-green-800' : 'border-gray-200 bg-gray-100 text-gray-700'}`}>
                          {notice.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{notice.content}</p>
                      <p className="text-xs text-gray-500">
                        {notice.noticeType?.replace(/_/g, ' ')} • Created {formatDate(notice.createdAt)}
                        {notice.expiryDate ? ` • Expires ${formatDate(notice.expiryDate)}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => togglePublish(notice)}>
                        <Megaphone className="h-3.5 w-3.5" />
                        <span>{notice.isPublished ? 'Unpublish' : 'Publish'}</span>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => removeNotice(notice.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Notice"
        description="Send a new notice to tenants"
      >
        <form className="space-y-4" onSubmit={createNotice}>
          <Input
            label="Title *"
            placeholder="Notice title"
            value={formData.title}
            onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
            error={formErrors.title}
          />

          <label className="flex flex-col gap-1 text-sm text-gray-700">
            <span className="text-sm font-medium">Content *</span>
            <textarea
              rows={4}
              value={formData.content}
              onChange={(event) => setFormData((prev) => ({ ...prev, content: event.target.value }))}
              className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                formErrors.content ? 'border-red-400' : 'border-gray-200'
              }`}
              placeholder="Write the notice content"
            />
            {formErrors.content && <span className="text-xs text-red-600">{formErrors.content}</span>}
          </label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              <span className="text-sm font-medium">Notice Type</span>
              <select
                value={formData.noticeType}
                onChange={(event) => setFormData((prev) => ({ ...prev, noticeType: event.target.value }))}
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {NOTICE_TYPES.map((type) => (
                  <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-700">
              <span className="text-sm font-medium">Priority</span>
              <select
                value={formData.priority}
                onChange={(event) => setFormData((prev) => ({ ...prev, priority: event.target.value }))}
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {PRIORITY_LEVELS.map((priority) => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </label>

            <Input
              label="Expiry Date"
              type="date"
              value={formData.expiryDate}
              onChange={(event) => setFormData((prev) => ({ ...prev, expiryDate: event.target.value }))}
            />

            <label className="flex items-center gap-2 pt-7 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(event) => setFormData((prev) => ({ ...prev, isPublished: event.target.checked }))}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span>Publish immediately</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create Notice</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
