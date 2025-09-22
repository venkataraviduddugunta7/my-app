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
  Bell,
  Plus,
  Edit,
  Trash2,
  Eye,
  Send,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  Users,
  Megaphone,
  List,
  Grid3X3,
  Search
} from 'lucide-react';

// Mock notices data
const mockNotices = [
  {
    id: 1,
    title: 'Monthly Maintenance Schedule',
    content: 'Dear Residents, Please note that monthly maintenance work will be conducted on 15th of this month from 9 AM to 5 PM. Water supply may be interrupted during this time.',
    type: 'maintenance',
    priority: 'high',
    targetAudience: 'all',
    createdDate: '2024-01-10',
    publishDate: '2024-01-10',
    status: 'published',
    readBy: 8,
    totalRecipients: 10
  },
  {
    id: 2,
    title: 'Rent Payment Reminder',
    content: 'This is a friendly reminder that rent for the month of January is due by 5th. Please make your payment on time to avoid late fees.',
    type: 'payment',
    priority: 'medium',
    targetAudience: 'all',
    createdDate: '2024-01-01',
    publishDate: '2024-01-01',
    status: 'published',
    readBy: 10,
    totalRecipients: 10
  },
  {
    id: 3,
    title: 'New Wi-Fi Password',
    content: 'The Wi-Fi password has been updated for security reasons. New password: PGSecure2024. Please update your devices.',
    type: 'general',
    priority: 'medium',
    targetAudience: 'all',
    createdDate: '2024-01-08',
    publishDate: '2024-01-08',
    status: 'published',
    readBy: 7,
    totalRecipients: 10
  },
  {
    id: 4,
    title: 'Emergency Contact Update',
    content: 'Please update your emergency contact information if there have been any changes. Contact the office for the form.',
    type: 'important',
    priority: 'low',
    targetAudience: 'all',
    createdDate: '2024-01-05',
    publishDate: '2024-01-05',
    status: 'draft',
    readBy: 0,
    totalRecipients: 10
  }
];

const noticeTypes = {
  'general': { 
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    icon: Info,
    label: 'General'
  },
  'maintenance': { 
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    icon: AlertTriangle,
    label: 'Maintenance'
  },
  'payment': { 
    color: 'text-green-600 bg-green-50 border-green-200',
    icon: CheckCircle,
    label: 'Payment'
  },
  'important': { 
    color: 'text-red-600 bg-red-50 border-red-200',
    icon: Bell,
    label: 'Important'
  }
};

const priorityConfig = {
  'low': { color: 'text-gray-600', label: 'Low' },
  'medium': { color: 'text-yellow-600', label: 'Medium' },
  'high': { color: 'text-red-600', label: 'High' }
};

const statusConfig = {
  'draft': { color: 'text-gray-600 bg-gray-50', label: 'Draft' },
  'published': { color: 'text-green-600 bg-green-50', label: 'Published' },
  'archived': { color: 'text-purple-600 bg-purple-50', label: 'Archived' }
};

function NoticeCard({ notice }) {
  const dispatch = useDispatch();
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const typeInfo = noticeTypes[notice.type];
  const TypeIcon = typeInfo.icon;
  const priority = priorityConfig[notice.priority];
  const status = statusConfig[notice.status];
  const readPercentage = ((notice.readBy / notice.totalRecipients) * 100).toFixed(0);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      dispatch(addToast({
        title: 'Notice Deleted',
        description: `"${notice.title}" has been deleted successfully.`,
        variant: 'success'
      }));
    }
  };

  const handlePublish = () => {
    dispatch(addToast({
      title: 'Notice Published',
      description: `"${notice.title}" has been published successfully.`,
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
                <CardTitle className="text-lg line-clamp-2">{notice.title}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Created: {formatDate(notice.createdDate)}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                {status.label}
              </div>
              <div className={`text-xs font-medium ${priority.color}`}>
                {priority.label} Priority
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Content Preview */}
          <p className="text-sm text-gray-700 line-clamp-3">
            {notice.content}
          </p>

          {/* Read Statistics */}
          {notice.status === 'published' && (
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">
                  {notice.readBy}/{notice.totalRecipients} read ({readPercentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-green-500 h-1.5 rounded-full" 
                  style={{ width: `${readPercentage}%` }}
                ></div>
              </div>
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
              onClick={() => setShowEditModal(true)}
              className="flex-1"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            {notice.status === 'draft' && (
              <Button
                size="sm"
                onClick={handlePublish}
                className="flex-1"
              >
                <Send className="w-4 h-4 mr-1" />
                Publish
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
      <NoticeDetailsModal
        notice={notice}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />

      {/* Edit Modal */}
      <NoticeFormModal
        notice={notice}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        mode="edit"
      />
    </>
  );
}

// Notice Table Component
function NoticeTable({ notices, onView, onEdit, onDelete, onPublish }) {
  const getTypeBadge = (type) => {
    const typeInfo = noticeTypes[type];
    const TypeIcon = typeInfo.icon;
    
    return (
      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
        <TypeIcon className="w-3 h-3" />
        <span>{typeInfo.label}</span>
      </div>
    );
  };

  const getStatusBadge = (status) => {
    const statusInfo = statusConfig[status];
    
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        <span>{statusInfo.label}</span>
      </div>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityInfo = priorityConfig[priority];
    
    return (
      <span className={`text-xs font-medium ${priorityInfo.color}`}>
        {priorityInfo.label}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Notice Details
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type & Priority
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Engagement
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {notices.map((notice) => {
            const readPercentage = ((notice.readBy / notice.totalRecipients) * 100).toFixed(0);
            return (
              <tr key={notice.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-start">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 line-clamp-2">
                        {notice.title}
                      </div>
                      <div className="text-sm text-gray-500 line-clamp-2 mt-1">
                        {notice.content}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    {getTypeBadge(notice.type)}
                    <div>{getPriorityBadge(notice.priority)}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(notice.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {notice.status === 'published' ? (
                    <div className="space-y-1">
                      <div className="text-sm text-gray-900">
                        {notice.readBy}/{notice.totalRecipients} read
                      </div>
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-green-500 h-1.5 rounded-full" 
                          style={{ width: `${readPercentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500">{readPercentage}%</div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Not published</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(notice.createdDate)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView(notice)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(notice)}
                      className="text-green-600 hover:text-green-900"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {notice.status === 'draft' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPublish(notice)}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(notice)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {notices.length === 0 && (
        <div className="text-center py-12">
          <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notices found</h3>
          <p className="text-gray-500">Try adjusting your search terms or filters.</p>
        </div>
      )}
    </div>
  );
}

function NoticeDetailsModal({ notice, isOpen, onClose }) {
  if (!notice) return null;

  const typeInfo = noticeTypes[notice.type];
  const TypeIcon = typeInfo.icon;
  const readPercentage = ((notice.readBy / notice.totalRecipients) * 100).toFixed(0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notice Details" size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className={`p-4 rounded-lg border ${typeInfo.color}`}>
          <div className="flex items-center space-x-2">
            <TypeIcon className="w-5 h-5" />
            <span className="font-medium">{typeInfo.label} Notice</span>
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{notice.title}</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>Created: {formatDate(notice.createdDate)}</span>
            <span>Published: {formatDate(notice.publishDate)}</span>
            <span className={`font-medium ${priorityConfig[notice.priority].color}`}>
              {priorityConfig[notice.priority].label} Priority
            </span>
          </div>
        </div>

        {/* Content */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Content</h4>
          <p className="text-gray-700 leading-relaxed">{notice.content}</p>
        </div>

        {/* Statistics */}
        {notice.status === 'published' && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Read Statistics</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Recipients:</span>
                <span className="font-medium">{notice.totalRecipients}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Read by:</span>
                <span className="font-medium text-green-600">{notice.readBy}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Read Rate:</span>
                <span className="font-medium">{readPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${readPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function NoticeFormModal({ notice, isOpen, onClose, mode = 'add' }) {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    title: notice?.title || '',
    content: notice?.content || '',
    type: notice?.type || 'general',
    priority: notice?.priority || 'medium',
    targetAudience: notice?.targetAudience || 'all'
  });

  const typeOptions = [
    { value: 'general', label: 'General' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'payment', label: 'Payment' },
    { value: 'important', label: 'Important' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' }
  ];

  const audienceOptions = [
    { value: 'all', label: 'All Tenants' },
    { value: 'floor1', label: 'Floor 1 Only' },
    { value: 'floor2', label: 'Floor 2 Only' },
    { value: 'specific', label: 'Specific Rooms' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (mode === 'edit') {
      dispatch(addToast({
        title: 'Notice Updated',
        description: `"${formData.title}" has been updated successfully.`,
        variant: 'success'
      }));
    } else {
      dispatch(addToast({
        title: 'Notice Created',
        description: `"${formData.title}" has been created successfully.`,
        variant: 'success'
      }));
    }

    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={mode === 'edit' ? 'Edit Notice' : 'Create New Notice'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Notice Title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required
        />

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Content</label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Dropdown
            label="Notice Type"
            options={typeOptions}
            value={formData.type}
            onChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
          />
          <Dropdown
            label="Priority"
            options={priorityOptions}
            value={formData.priority}
            onChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
          />
          <Dropdown
            label="Target Audience"
            options={audienceOptions}
            value={formData.targetAudience}
            onChange={(value) => setFormData(prev => ({ ...prev, targetAudience: value }))}
          />
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {mode === 'edit' ? 'Update Notice' : 'Create Notice'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default function NoticesPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);

  const typeFilterOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'general', label: 'General' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'payment', label: 'Payment' },
    { value: 'important', label: 'Important' }
  ];

  const statusFilterOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' }
  ];

  const filteredNotices = mockNotices.filter(notice => {
    const matchesType = filterType === 'all' || notice.type === filterType;
    const matchesStatus = filterStatus === 'all' || notice.status === filterStatus;
    const matchesSearch = notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notice.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesStatus && matchesSearch;
  });

  const stats = {
    total: mockNotices.length,
    published: mockNotices.filter(n => n.status === 'published').length,
    draft: mockNotices.filter(n => n.status === 'draft').length,
    totalReads: mockNotices.reduce((sum, n) => sum + n.readBy, 0)
  };

  // Handler functions
  const handleView = (notice) => {
    setSelectedNotice(notice);
    setShowDetailsModal(true);
  };

  const handleEdit = (notice) => {
    setSelectedNotice(notice);
    setShowEditModal(true);
  };

  const handleDelete = (notice) => {
    if (window.confirm(`Are you sure you want to delete "${notice.title}"?`)) {
      console.log('Delete notice:', notice.id);
      // TODO: Implement delete functionality
    }
  };

  const handlePublish = (notice) => {
    console.log('Publish notice:', notice.id);
    // TODO: Implement publish functionality
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
          <h1 className="text-3xl font-bold text-gray-900">Notices & Announcements</h1>
          <p className="text-gray-600 mt-2">
            Communicate important information to your tenants ({filteredNotices.length}{filteredNotices.length !== mockNotices.length ? `/${mockNotices.length}` : ''})
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
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Notices</p>
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
            filterStatus === 'published' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:shadow-lg'
          }`}
          onClick={() => handleStatusCardClick('published')}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-xl font-bold text-green-600">{stats.published}</p>
                {filterStatus === 'published' && (
                  <span className="text-xs text-green-600 font-medium">Active Filter</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all duration-200 ${
            filterStatus === 'draft' ? 'ring-2 ring-gray-500 bg-gray-50' : 'hover:shadow-lg'
          }`}
          onClick={() => handleStatusCardClick('draft')}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-50 rounded-lg">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Drafts</p>
                <p className="text-xl font-bold text-gray-600">{stats.draft}</p>
                {filterStatus === 'draft' && (
                  <span className="text-xs text-gray-600 font-medium">Active Filter</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Reads</p>
                <p className="text-xl font-bold text-purple-600">{stats.totalReads}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls Section */}
      {mockNotices.length > 0 && (
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
                      placeholder="Search notices by title or content..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-48">
                  <Dropdown
                    options={typeFilterOptions}
                    value={filterType}
                    onChange={setFilterType}
                    placeholder="Filter by type"
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
                
                {/* Action Button */}
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Notice
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notices Display */}
      {filteredNotices.length > 0 && (
        <>
          {viewMode === 'table' ? (
            <Card>
              <CardContent className="p-0">
                <NoticeTable
                  notices={filteredNotices}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onPublish={handlePublish}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNotices.map((notice) => (
                <NoticeCard key={notice.id} notice={notice} />
              ))}
            </div>
          )}
        </>
      )}

      {filteredNotices.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notices found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search terms or clear the filters to see all notices.' 
                : 'Get started by creating your first notice.'}
            </p>
            {searchTerm || filterType !== 'all' || filterStatus !== 'all' ? (
              <Button variant="outline" onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterStatus('all');
              }}>
                Clear Filters
              </Button>
            ) : (
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Notice
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <NoticeFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        mode="add"
      />
      
      <NoticeDetailsModal
        notice={selectedNotice}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />

      <NoticeFormModal
        notice={selectedNotice}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        mode="edit"
      />
    </div>
  );
} 