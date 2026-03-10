'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import apiService from '@/services/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Modal } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import {
  CircleAlert,
  FileText,
  Loader2,
  Link2,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';

const DOCUMENT_TYPES = ['AGREEMENT', 'ID_PROOF', 'RECEIPT', 'POLICY', 'MAINTENANCE', 'LEGAL', 'INSURANCE', 'OTHER'];

const defaultForm = {
  title: '',
  description: '',
  documentType: 'AGREEMENT',
  fileName: '',
  filePath: '',
  mimeType: 'application/pdf',
  fileSize: '',
  tags: '',
  isPublic: false,
  expiryDate: '',
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatFileSize = (bytes) => {
  const size = toNumber(bytes);
  if (size <= 0) return '0 B';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export default function DocumentsPage() {
  const { selectedProperty } = useSelector((state) => state.property);

  const [filters, setFilters] = useState({
    search: '',
    documentType: '',
    isPublic: '',
  });

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const loadDocuments = useCallback(async () => {
    if (!selectedProperty?.id) return;

    setLoading(true);
    setError('');

    try {
      const response = await apiService.documents.getAll(selectedProperty.id, {
        search: filters.search,
        documentType: filters.documentType,
        isPublic: filters.isPublic,
        limit: 100,
      });

      const payload = response.data?.documents || response.data || [];
      setDocuments(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setError(err.message || 'Failed to load documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [filters.documentType, filters.isPublic, filters.search, selectedProperty?.id]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const stats = useMemo(() => {
    const total = documents.length;
    const publicDocs = documents.filter((document) => document.isPublic).length;
    const expiringSoon = documents.filter((document) => {
      if (!document.expiryDate) return false;
      const expiry = new Date(document.expiryDate);
      const now = new Date();
      const thirtyDays = new Date(now);
      thirtyDays.setDate(now.getDate() + 30);
      return expiry >= now && expiry <= thirtyDays;
    }).length;

    return { total, publicDocs, expiringSoon };
  }, [documents]);

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.fileName.trim()) {
      errors.fileName = 'File name is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createDocument = async (event) => {
    event.preventDefault();

    if (!selectedProperty?.id) return;
    if (!validateForm()) return;

    setSaving(true);
    setError('');

    try {
      await apiService.documents.create(selectedProperty.id, {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        documentType: formData.documentType,
        fileName: formData.fileName.trim(),
        filePath: formData.filePath.trim() || null,
        mimeType: formData.mimeType.trim() || 'application/octet-stream',
        fileSize: toNumber(formData.fileSize, 0),
        tags: formData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        isPublic: formData.isPublic,
        expiryDate: formData.expiryDate || null,
      });

      setFormData(defaultForm);
      setFormErrors({});
      setShowCreateModal(false);
      await loadDocuments();
    } catch (err) {
      setError(err.message || 'Failed to create document');
    } finally {
      setSaving(false);
    }
  };

  const removeDocument = async (documentId) => {
    if (!selectedProperty?.id) return;

    const confirmed = window.confirm('Delete this document record?');
    if (!confirmed) return;

    try {
      await apiService.documents.delete(selectedProperty.id, documentId);
      await loadDocuments();
    } catch (err) {
      setError(err.message || 'Failed to delete document');
    }
  };

  if (!selectedProperty) {
    return (
      <div className="space-y-6 p-6">
        <Card hover={false} className="border-gray-200 bg-white/85">
          <CardContent className="p-10 text-center text-gray-600">Select a property to manage documents.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Documents</h1>
          <p className="mt-1 text-sm text-gray-600">
            Keep agreements and records organized for <span className="font-medium">{selectedProperty.name}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={loadDocuments} loading={loading}>
            {!loading && <RefreshCw className="h-4 w-4" />}
            <span>Refresh</span>
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4" />
            <span>Add Document</span>
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card hover={false} className="border-gray-200/80 bg-white/85 shadow-sm"><CardContent className="p-5"><p className="text-sm text-gray-600">Total Docs</p><p className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</p></CardContent></Card>
        <Card hover={false} className="border-gray-200/80 bg-white/85 shadow-sm"><CardContent className="p-5"><p className="text-sm text-gray-600">Public Docs</p><p className="mt-1 text-2xl font-semibold text-gray-900">{stats.publicDocs}</p></CardContent></Card>
        <Card hover={false} className="border-gray-200/80 bg-white/85 shadow-sm"><CardContent className="p-5"><p className="text-sm text-gray-600">Expiring in 30 days</p><p className="mt-1 text-2xl font-semibold text-gray-900">{stats.expiringSoon}</p></CardContent></Card>
      </div>

      <Card hover={false} className="border-gray-200/80 bg-white/85 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input
              label="Search"
              placeholder="Title or file name"
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            />

            <label className="flex flex-col gap-1 text-sm text-gray-700">
              <span className="text-sm font-medium">Document Type</span>
              <select
                value={filters.documentType}
                onChange={(event) => setFilters((prev) => ({ ...prev, documentType: event.target.value }))}
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">All types</option>
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-700">
              <span className="text-sm font-medium">Visibility</span>
              <select
                value={filters.isPublic}
                onChange={(event) => setFilters((prev) => ({ ...prev, isPublic: event.target.value }))}
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">All</option>
                <option value="true">Public</option>
                <option value="false">Private</option>
              </select>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card hover={false} className="border-gray-200/80 bg-white/85 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Document Library
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading documents...</span>
            </div>
          ) : documents.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-600">No documents found for the selected filters.</p>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {documents.map((document) => (
                  <div key={document.id} className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{document.title}</p>
                        <p className="text-xs text-gray-500">{document.fileName}</p>
                      </div>
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${document.isPublic ? 'border-green-200 bg-green-100 text-green-800' : 'border-gray-200 bg-gray-100 text-gray-700'}`}>
                        {document.isPublic ? 'Public' : 'Private'}
                      </span>
                    </div>
                    <div className="mt-3 space-y-1.5 text-sm text-gray-700">
                      <p><span className="font-medium text-gray-900">Type:</span> {document.documentType?.replace(/_/g, ' ')}</p>
                      <p><span className="font-medium text-gray-900">Size:</span> {formatFileSize(document.fileSize)}</p>
                      <p><span className="font-medium text-gray-900">Created:</span> {formatDate(document.createdAt)}</p>
                    </div>
                    <div className="mt-3 flex flex-col gap-2">
                      {document.filePath?.startsWith('http') && (
                        <a href={document.filePath} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                          <Link2 className="h-3 w-3" />
                          Open link
                        </a>
                      )}
                      <Button size="sm" variant="outline" className="w-full" onClick={() => removeDocument(document.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto rounded-2xl border border-gray-200/80 bg-white md:block">
                <table className="min-w-[760px] w-full text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100/70">
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-4 py-3">Document</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">Visibility</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {documents.map((document) => (
                      <tr key={document.id}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{document.title}</p>
                          <p className="text-xs text-gray-500">{document.fileName}</p>
                          {document.filePath?.startsWith('http') && (
                            <a href={document.filePath} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                              <Link2 className="h-3 w-3" />
                              Open link
                            </a>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{document.documentType?.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3 text-gray-700">{formatFileSize(document.fileSize)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${document.isPublic ? 'border-green-200 bg-green-100 text-green-800' : 'border-gray-200 bg-gray-100 text-gray-700'}`}>
                            {document.isPublic ? 'Public' : 'Private'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{formatDate(document.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="outline" onClick={() => removeDocument(document.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </Button>
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
        title="Add Document"
        description="Create a document entry with file reference details"
      >
        <form className="space-y-4" onSubmit={createDocument}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Title *"
              placeholder="Agreement - Room 201"
              value={formData.title}
              onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
              error={formErrors.title}
            />
            <Input
              label="File Name *"
              placeholder="agreement-room-201.pdf"
              value={formData.fileName}
              onChange={(event) => setFormData((prev) => ({ ...prev, fileName: event.target.value }))}
              error={formErrors.fileName}
            />

            <label className="flex flex-col gap-1 text-sm text-gray-700">
              <span className="text-sm font-medium">Document Type</span>
              <select
                value={formData.documentType}
                onChange={(event) => setFormData((prev) => ({ ...prev, documentType: event.target.value }))}
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </label>

            <Input
              label="Reference URL / Path"
              placeholder="https://... or local reference"
              value={formData.filePath}
              onChange={(event) => setFormData((prev) => ({ ...prev, filePath: event.target.value }))}
            />

            <Input
              label="MIME Type"
              placeholder="application/pdf"
              value={formData.mimeType}
              onChange={(event) => setFormData((prev) => ({ ...prev, mimeType: event.target.value }))}
            />

            <Input
              label="File Size (bytes)"
              type="number"
              min="0"
              value={formData.fileSize}
              onChange={(event) => setFormData((prev) => ({ ...prev, fileSize: event.target.value }))}
            />

            <Input
              label="Expiry Date"
              type="date"
              value={formData.expiryDate}
              onChange={(event) => setFormData((prev) => ({ ...prev, expiryDate: event.target.value }))}
            />

            <label className="flex items-center gap-2 pt-7 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(event) => setFormData((prev) => ({ ...prev, isPublic: event.target.checked }))}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span>Visible to all property users</span>
            </label>
          </div>

          <Input
            label="Tags"
            placeholder="agreement, tenant, room-201"
            value={formData.tags}
            onChange={(event) => setFormData((prev) => ({ ...prev, tags: event.target.value }))}
          />

          <label className="flex flex-col gap-1 text-sm text-gray-700">
            <span className="text-sm font-medium">Description</span>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Optional context for this document"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save Document</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
