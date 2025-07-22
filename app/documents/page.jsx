'use client';

import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToast } from '@/store/slices/uiSlice';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Button,
  Input,
  Dropdown,
  Modal,
  ModalFooter
} from '@/components/ui';
import { formatDate } from '@/lib/utils';
import {
  FileText,
  Plus,
  Download,
  Upload,
  Eye,
  Trash2,
  Search,
  Filter,
  Shield,
  User,
  Building,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  List,
  Grid3X3,
  Edit
} from 'lucide-react';

// Mock documents data
const mockDocuments = [
  {
    id: 1,
    name: 'Raj Kumar - Aadhar Card',
    fileName: 'raj_kumar_aadhar.pdf',
    type: 'tenant_document',
    category: 'identity',
    tenantId: 1,
    tenantName: 'Raj Kumar',
    roomNumber: '101',
    uploadDate: '2024-01-15',
    fileSize: '2.5 MB',
    status: 'verified',
    expiryDate: null,
    description: 'Identity proof document'
  },
  {
    id: 2,
    name: 'Priya Sharma - PAN Card',
    fileName: 'priya_sharma_pan.pdf',
    type: 'tenant_document',
    category: 'identity',
    tenantId: 2,
    tenantName: 'Priya Sharma',
    roomNumber: '201',
    uploadDate: '2024-02-01',
    fileSize: '1.8 MB',
    status: 'verified',
    expiryDate: null,
    description: 'PAN card for tax purposes'
  },
  {
    id: 3,
    name: 'Fire Safety Certificate',
    fileName: 'fire_safety_certificate.pdf',
    type: 'pg_document',
    category: 'legal',
    tenantId: null,
    tenantName: null,
    roomNumber: null,
    uploadDate: '2024-01-01',
    fileSize: '5.2 MB',
    status: 'valid',
    expiryDate: '2024-12-31',
    description: 'Annual fire safety compliance certificate'
  },
  {
    id: 4,
    name: 'Raj Kumar - Salary Slip',
    fileName: 'raj_kumar_salary_dec2023.pdf',
    type: 'tenant_document',
    category: 'financial',
    tenantId: 1,
    tenantName: 'Raj Kumar',
    roomNumber: '101',
    uploadDate: '2024-01-15',
    fileSize: '1.2 MB',
    status: 'pending',
    expiryDate: null,
    description: 'December 2023 salary slip'
  },
  {
    id: 5,
    name: 'Property Registration',
    fileName: 'property_registration.pdf',
    type: 'pg_document',
    category: 'legal',
    tenantId: null,
    tenantName: null,
    roomNumber: null,
    uploadDate: '2024-01-01',
    fileSize: '8.1 MB',
    status: 'valid',
    expiryDate: null,
    description: 'Property ownership documents'
  },
  {
    id: 6,
    name: 'Priya Sharma - Photo',
    fileName: 'priya_sharma_photo.jpg',
    type: 'tenant_document',
    category: 'photo',
    tenantId: 2,
    tenantName: 'Priya Sharma',
    roomNumber: '201',
    uploadDate: '2024-02-01',
    fileSize: '0.8 MB',
    status: 'verified',
    expiryDate: null,
    description: 'Passport size photograph'
  }
];

const documentTypes = {
  'tenant_document': { 
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    icon: User,
    label: 'Tenant Document'
  },
  'pg_document': { 
    color: 'text-green-600 bg-green-50 border-green-200',
    icon: Building,
    label: 'PG Document'
  }
};

const categoryTypes = {
  'identity': { label: 'Identity', icon: Shield },
  'financial': { label: 'Financial', icon: FileText },
  'photo': { label: 'Photo', icon: User },
  'legal': { label: 'Legal', icon: Building }
};

const statusConfig = {
  'verified': { color: 'text-green-600 bg-green-50', label: 'Verified', icon: CheckCircle },
  'valid': { color: 'text-green-600 bg-green-50', label: 'Valid', icon: CheckCircle },
  'pending': { color: 'text-yellow-600 bg-yellow-50', label: 'Pending', icon: Clock },
  'expired': { color: 'text-red-600 bg-red-50', label: 'Expired', icon: AlertTriangle },
  'rejected': { color: 'text-red-600 bg-red-50', label: 'Rejected', icon: AlertTriangle }
};

function DocumentCard({ document }) {
  const dispatch = useDispatch();
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const typeInfo = documentTypes[document.type];
  const TypeIcon = typeInfo.icon;
  const categoryInfo = categoryTypes[document.category];
  const CategoryIcon = categoryInfo.icon;
  const statusInfo = statusConfig[document.status];
  const StatusIcon = statusInfo.icon;

  const isExpiringSoon = document.expiryDate && 
    new Date(document.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      dispatch(addToast({
        title: 'Document Deleted',
        description: `"${document.name}" has been deleted successfully.`,
        variant: 'success'
      }));
    }
  };

  const handleDownload = () => {
    dispatch(addToast({
      title: 'Download Started',
      description: `Downloading "${document.fileName}"`,
      variant: 'info'
    }));
  };

  const handleVerify = () => {
    dispatch(addToast({
      title: 'Document Verified',
      description: `"${document.name}" has been marked as verified.`,
      variant: 'success'
    }));
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                <TypeIcon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg line-clamp-2">{document.name}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {document.fileName} • {document.fileSize}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color} flex items-center space-x-1`}>
                <StatusIcon className="w-3 h-3" />
                <span>{statusInfo.label}</span>
              </div>
              {isExpiringSoon && (
                <div className="px-2 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-600">
                  Expiring Soon
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Document Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Category:</p>
              <div className="flex items-center space-x-1 mt-1">
                <CategoryIcon className="w-3 h-3 text-gray-600" />
                <span className="font-medium">{categoryInfo.label}</span>
              </div>
            </div>
            <div>
              <p className="text-gray-500">Upload Date:</p>
              <p className="font-medium mt-1">{formatDate(document.uploadDate)}</p>
            </div>
          </div>

          {/* Tenant Info */}
          {document.tenantName && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">{document.tenantName}</span>
                <span className="text-sm text-gray-500">• Room {document.roomNumber}</span>
              </div>
            </div>
          )}

          {/* Expiry Date */}
          {document.expiryDate && (
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">
                Expires: {formatDate(document.expiryDate)}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetailsModal(true)}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
            {document.status === 'pending' && (
              <Button
                size="sm"
                onClick={handleVerify}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Verify
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      <DocumentDetailsModal
        document={document}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />
    </>
  );
}

function DocumentDetailsModal({ document, isOpen, onClose }) {
  if (!document) return null;

  const typeInfo = documentTypes[document.type];
  const TypeIcon = typeInfo.icon;
  const categoryInfo = categoryTypes[document.category];
  const statusInfo = statusConfig[document.status];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Document Details" size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className={`p-4 rounded-lg border ${typeInfo.color}`}>
          <div className="flex items-center space-x-2">
            <TypeIcon className="w-5 h-5" />
            <span className="font-medium">{typeInfo.label}</span>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Document Information</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Name:</span>
                <span className="font-medium">{document.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">File Name:</span>
                <span className="font-medium">{document.fileName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Category:</span>
                <span className="font-medium">{categoryInfo.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">File Size:</span>
                <span className="font-medium">{document.fileSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className={`font-medium ${statusInfo.color.split(' ')[0]}`}>
                  {statusInfo.label}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Dates & Details</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Upload Date:</span>
                <span className="font-medium">{formatDate(document.uploadDate)}</span>
              </div>
              {document.expiryDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Expiry Date:</span>
                  <span className="font-medium">{formatDate(document.expiryDate)}</span>
                </div>
              )}
              {document.tenantName && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tenant:</span>
                    <span className="font-medium">{document.tenantName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Room:</span>
                    <span className="font-medium">{document.roomNumber}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Description</h4>
          <p className="text-gray-700">{document.description}</p>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200">
          <Button variant="outline" className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          {document.status === 'pending' && (
            <Button className="flex-1">
              <CheckCircle className="w-4 h-4 mr-2" />
              Verify Document
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

// Document Table Component
function DocumentTable({ documents, onView, onEdit, onDelete, onDownload, onVerify }) {
  const getTypeBadge = (type) => {
    const typeInfo = documentTypes[type];
    const TypeIcon = typeInfo.icon;
    
    return (
      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
        <TypeIcon className="w-3 h-3" />
        <span>{typeInfo.label}</span>
      </div>
    );
  };

  const getCategoryBadge = (category) => {
    const categoryInfo = categoryTypes[category];
    const CategoryIcon = categoryInfo.icon;
    
    return (
      <div className="inline-flex items-center space-x-1 text-xs text-gray-600">
        <CategoryIcon className="w-3 h-3" />
        <span>{categoryInfo.label}</span>
      </div>
    );
  };

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

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Document Details
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type & Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tenant Info
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Upload Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              File Size
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {documents.map((document) => (
            <tr key={document.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 line-clamp-2">
                    {document.name}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {document.fileName}
                  </div>
                  {document.expiryDate && isExpiringSoon(document.expiryDate) && (
                    <div className="text-xs text-orange-600 mt-1 font-medium">
                      Expiring Soon
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="space-y-1">
                  {getTypeBadge(document.type)}
                  {getCategoryBadge(document.category)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {document.tenantName ? (
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {document.tenantName}
                    </div>
                    <div className="text-sm text-gray-500">
                      Room {document.roomNumber}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    PG Document
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(document.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {formatDate(document.uploadDate)}
                </div>
                {document.expiryDate && (
                  <div className="text-xs text-gray-500">
                    Expires: {formatDate(document.expiryDate)}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {document.fileSize}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(document)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownload(document)}
                    className="text-green-600 hover:text-green-900"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  {document.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onVerify(document)}
                      className="text-purple-600 hover:text-purple-900"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(document)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {documents.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
          <p className="text-gray-500">Try adjusting your search terms or filters.</p>
        </div>
      )}
    </div>
  );
}

function UploadModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    type: 'tenant_document',
    category: 'identity',
    tenantId: '',
    description: '',
    expiryDate: ''
  });

  const { tenants } = useSelector((state) => state.tenants);

  const typeOptions = [
    { value: 'tenant_document', label: 'Tenant Document' },
    { value: 'pg_document', label: 'PG Document' }
  ];

  const categoryOptions = [
    { value: 'identity', label: 'Identity' },
    { value: 'financial', label: 'Financial' },
    { value: 'photo', label: 'Photo' },
    { value: 'legal', label: 'Legal' }
  ];

  const tenantOptions = tenants.map(tenant => ({
    value: tenant.id,
    label: `${tenant.name} (Room ${tenant.roomNumber})`
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    
    dispatch(addToast({
      title: 'Document Uploaded',
      description: `"${formData.name}" has been uploaded successfully.`,
      variant: 'success'
    }));

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload New Document" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Document Name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Dropdown
            label="Document Type"
            options={typeOptions}
            value={formData.type}
            onChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
          />
          <Dropdown
            label="Category"
            options={categoryOptions}
            value={formData.category}
            onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
          />
        </div>

        {formData.type === 'tenant_document' && (
          <Dropdown
            label="Tenant"
            options={tenantOptions}
            value={formData.tenantId}
            onChange={(value) => setFormData(prev => ({ ...prev, tenantId: value }))}
            searchable
            required
          />
        )}

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <Input
          label="Expiry Date (Optional)"
          type="date"
          value={formData.expiryDate}
          onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
        />

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Select File</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">Drag and drop files here, or click to browse</p>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              required
            />
            <Button type="button" variant="outline" size="sm">
              Browse Files
            </Button>
          </div>
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Upload Document
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default function DocumentsPage() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const typeFilterOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'tenant_document', label: 'Tenant Documents' },
    { value: 'pg_document', label: 'PG Documents' }
  ];

  const categoryFilterOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'identity', label: 'Identity' },
    { value: 'financial', label: 'Financial' },
    { value: 'photo', label: 'Photo' },
    { value: 'legal', label: 'Legal' }
  ];

  const statusFilterOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'verified', label: 'Verified' },
    { value: 'valid', label: 'Valid' },
    { value: 'pending', label: 'Pending' },
    { value: 'expired', label: 'Expired' }
  ];

  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesType = filterType === 'all' || doc.type === filterType;
    const matchesCategory = filterCategory === 'all' || doc.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.tenantName && doc.tenantName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesType && matchesCategory && matchesStatus && matchesSearch;
  });

  const stats = {
    total: mockDocuments.length,
    tenantDocs: mockDocuments.filter(d => d.type === 'tenant_document').length,
    pgDocs: mockDocuments.filter(d => d.type === 'pg_document').length,
    pending: mockDocuments.filter(d => d.status === 'pending').length
  };

  // Handler functions
  const handleView = (document) => {
    setSelectedDocument(document);
    setShowDetailsModal(true);
  };

  const handleDownload = (document) => {
    console.log('Download document:', document.id);
    // TODO: Implement download functionality
  };

  const handleDelete = (document) => {
    if (window.confirm(`Are you sure you want to delete "${document.name}"?`)) {
      console.log('Delete document:', document.id);
      // TODO: Implement delete functionality
    }
  };

  const handleVerify = (document) => {
    console.log('Verify document:', document.id);
    // TODO: Implement verify functionality
  };

  // Handler for status card clicks
  const handleStatusCardClick = (status) => {
    setFilterStatus(status);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-600 mt-2">
            Manage tenant documents and PG legal documents ({filteredDocuments.length}{filteredDocuments.length !== mockDocuments.length ? `/${mockDocuments.length}` : ''})
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card 
          className={`cursor-pointer transition-all duration-200 ${
            filterStatus === 'all' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-lg'
          }`}
          onClick={() => handleStatusCardClick('all')}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Documents</p>
                <p className="text-xl font-bold">{stats.total}</p>
                {filterStatus === 'all' && (
                  <span className="text-xs text-blue-600 font-medium">Active Filter</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tenant Documents</p>
                <p className="text-xl font-bold text-purple-600">{stats.tenantDocs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Building className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">PG Documents</p>
                <p className="text-xl font-bold text-green-600">{stats.pgDocs}</p>
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
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
                {filterStatus === 'pending' && (
                  <span className="text-xs text-yellow-600 font-medium">Active Filter</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls Section */}
      {mockDocuments.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <div className="w-full sm:w-80">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search documents by name, tenant, or file..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-full sm:w-40">
                    <Dropdown
                      options={typeFilterOptions}
                      value={filterType}
                      onChange={setFilterType}
                      placeholder="Filter by type"
                    />
                  </div>
                  <div className="w-full sm:w-40">
                    <Dropdown
                      options={categoryFilterOptions}
                      value={filterCategory}
                      onChange={setFilterCategory}
                      placeholder="Filter by category"
                    />
                  </div>
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
                
                {/* Action Button */}
                <Button onClick={() => setShowUploadModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents Display */}
      {filteredDocuments.length > 0 && (
        <>
          {viewMode === 'table' ? (
            <Card>
              <CardContent className="p-0">
                <DocumentTable
                  documents={filteredDocuments}
                  onView={handleView}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                  onVerify={handleVerify}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((document) => (
                <DocumentCard key={document.id} document={document} />
              ))}
            </div>
          )}
        </>
      )}

      {filteredDocuments.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterType !== 'all' || filterCategory !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search terms or clear the filters to see all documents.' 
                : 'Get started by uploading your first document.'}
            </p>
            {searchTerm || filterType !== 'all' || filterCategory !== 'all' || filterStatus !== 'all' ? (
              <Button variant="outline" onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterCategory('all');
                setFilterStatus('all');
              }}>
                Clear Filters
              </Button>
            ) : (
              <Button onClick={() => setShowUploadModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Upload Your First Document
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />
      
      <DocumentDetailsModal
        document={selectedDocument}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />
    </div>
  );
} 