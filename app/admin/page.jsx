"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Shield,
  Activity,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Ban,
  Trash2,
  Eye,
  UserCog,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Dropdown } from "@/components/ui/Dropdown";

export default function AdminPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionModal, setActionModal] = useState({ open: false, type: null, user: null });

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [user, router]);

  // Fetch users and stats
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchUsers();
      fetchStats();
    }
  }, [user, searchTerm, statusFilter, roleFilter]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (roleFilter) params.append('role', roleFilter);
      params.append('limit', '50');

      const response = await fetch(`http://localhost:9000/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:9000/api/admin/users/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId, status, reason = '') => {
    try {
      const response = await fetch('http://localhost:9000/api/admin/users/status', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, status, reason }),
      });

      const data = await response.json();
      if (data.success) {
        fetchUsers();
        fetchStats();
        setActionModal({ open: false, type: null, user: null });
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const deleteUser = async (userId, reason) => {
    try {
      const response = await fetch('http://localhost:9000/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, reason }),
      });

      const data = await response.json();
      if (data.success) {
        fetchUsers();
        fetchStats();
        setActionModal({ open: false, type: null, user: null });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      WAITING_APPROVAL: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      BLOCKED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Blocked' },
      INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' },
      CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' },
    };
    
    const badge = badges[status] || badges.INACTIVE;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const badges = {
      ADMIN: { bg: 'bg-purple-100', text: 'text-purple-800', icon: Shield },
      OWNER: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Users },
      MANAGER: { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: UserCog },
      STAFF: { bg: 'bg-gray-100', text: 'text-gray-800', icon: Users },
    };
    
    const badge = badges[role] || badges.STAFF;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {role}
      </span>
    );
  };

  const userColumns = [
    {
      id: 'user',
      key: 'user',
      label: 'User Details',
      render: (user) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900">{user.fullName}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      )
    },
    {
      id: 'role',
      key: 'role',
      label: 'Role',
      render: (user) => getRoleBadge(user.role)
    },
    {
      id: 'status',
      key: 'subscriptionStatus',
      label: 'Status',
      render: (user) => getStatusBadge(user.subscriptionStatus)
    },
    {
      id: 'properties',
      key: 'properties',
      label: 'Properties',
      render: (user) => (
        <div className="text-sm">
          <div className="font-medium">{user._count.properties} Properties</div>
          <div className="text-gray-500">{user._count.createdTenants} Tenants</div>
        </div>
      )
    },
    {
      id: 'joined',
      key: 'createdAt',
      label: 'Joined',
      render: (user) => (
        <div className="text-sm text-gray-500">
          {new Date(user.createdAt).toLocaleDateString()}
        </div>
      )
    },
    {
      id: 'actions',
      key: 'actions',
      label: 'Actions',
      render: (user) => (
        <Dropdown
          trigger={
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          }
          items={[
            {
              label: 'View Details',
              icon: Eye,
              onClick: () => setSelectedUser(user)
            },
            ...(user.subscriptionStatus === 'WAITING_APPROVAL' ? [{
              label: 'Approve User',
              icon: CheckCircle,
              onClick: () => setActionModal({ open: true, type: 'approve', user })
            }] : []),
            ...(user.subscriptionStatus === 'ACTIVE' ? [{
              label: 'Block User',
              icon: Ban,
              onClick: () => setActionModal({ open: true, type: 'block', user })
            }] : []),
            ...(user.subscriptionStatus === 'BLOCKED' ? [{
              label: 'Unblock User',
              icon: CheckCircle,
              onClick: () => setActionModal({ open: true, type: 'unblock', user })
            }] : []),
            {
              label: 'Delete User',
              icon: Trash2,
              onClick: () => setActionModal({ open: true, type: 'delete', user }),
              className: 'text-red-600'
            }
          ]}
        />
      )
    }
  ];

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users and system settings</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overview.totalUsers}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overview.activeUsers}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overview.waitingApproval}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <UserX className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Blocked</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overview.blockedUsers}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">New (7d)</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overview.recentSignups}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="WAITING_APPROVAL">Pending Approval</option>
                <option value="ACTIVE">Active</option>
                <option value="BLOCKED">Blocked</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Roles</option>
                <option value="OWNER">Owner</option>
                <option value="MANAGER">Manager</option>
                <option value="STAFF">Staff</option>
              </select>
            </div>
            <div>
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setRoleFilter('');
                }}
                variant="outline"
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Users Table */}
        <Card>
          <DataTable
            data={users}
            columns={userColumns}
            emptyMessage="No users found"
          />
        </Card>

        {/* Action Modal */}
        <Modal
          isOpen={actionModal.open}
          onClose={() => setActionModal({ open: false, type: null, user: null })}
          title={`${actionModal.type === 'approve' ? 'Approve' : 
                   actionModal.type === 'block' ? 'Block' :
                   actionModal.type === 'unblock' ? 'Unblock' : 'Delete'} User`}
        >
          {actionModal.user && (
            <div>
              <p className="mb-4">
                Are you sure you want to {actionModal.type} <strong>{actionModal.user.fullName}</strong>?
              </p>
              
              {actionModal.type === 'delete' && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm font-medium mb-2">⚠️ This action cannot be undone!</p>
                  <p className="text-red-700 text-sm">
                    This will permanently delete the user and all associated data including properties, tenants, and payments.
                  </p>
                </div>
              )}

              {(actionModal.type === 'block' || actionModal.type === 'delete') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason {actionModal.type === 'delete' ? '(Required)' : '(Optional)'}
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows="3"
                    placeholder={`Enter reason for ${actionModal.type}ing this user...`}
                    onChange={(e) => setActionModal({...actionModal, reason: e.target.value})}
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setActionModal({ open: false, type: null, user: null })}
                >
                  Cancel
                </Button>
                <Button
                  variant={actionModal.type === 'delete' ? 'danger' : 'primary'}
                  onClick={() => {
                    if (actionModal.type === 'delete') {
                      deleteUser(actionModal.user.id, actionModal.reason || 'No reason provided');
                    } else {
                      const statusMap = {
                        approve: 'ACTIVE',
                        block: 'BLOCKED',
                        unblock: 'ACTIVE'
                      };
                      updateUserStatus(actionModal.user.id, statusMap[actionModal.type], actionModal.reason);
                    }
                  }}
                >
                  {actionModal.type === 'approve' ? 'Approve' : 
                   actionModal.type === 'block' ? 'Block' :
                   actionModal.type === 'unblock' ? 'Unblock' : 'Delete'} User
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
