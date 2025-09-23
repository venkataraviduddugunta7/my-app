'use client';

import React from 'react';
import { DataTable, columnTypes, statusConfigs, iconConfigs } from '@/components/ui/DataTable';
import { createColumnHelper } from '@tanstack/react-table';
import { User, Edit, Trash2, Phone, Mail, MapPin, Calendar, Home, Building, Bed, UserPlus, UserMinus } from 'lucide-react';

const columnHelper = createColumnHelper();

// Tenant table columns
export const createTenantColumns = (onEdit, onDelete, onVacate) => [
  columnTypes.icon('fullName', 'Tenant Details', iconConfigs.tenantIcons, {
    cell: ({ getValue, row }) => {
      const fullName = getValue();
      const tenantId = row.original.tenantId;
      
      return (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center mr-4 shadow-elegant">
            <User className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">
              {fullName}
            </div>
            <div className="text-xs text-gray-500">
              ID: {tenantId}
            </div>
          </div>
        </div>
      );
    }
  }),
  
  columnTypes.text('contact', 'Contact Information', {
    cell: ({ row }) => {
      const email = row.original.email;
      const phone = row.original.phone;
      
      return (
        <div>
          <div className="flex items-center text-sm text-gray-900 mb-1">
            <Phone className="w-3 h-3 mr-2 text-gray-400" />
            {phone || 'No phone'}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Mail className="w-3 h-3 mr-2 text-gray-400" />
            {email || 'No email'}
          </div>
        </div>
      );
    }
  }),
  
  columnTypes.text('accommodation', 'Accommodation', {
    cell: ({ row }) => {
      const bed = row.original.bed;
      const room = bed?.room;
      const floor = room?.floor;
      
      return (
        <div>
          <div className="flex items-center text-sm text-gray-900 mb-1">
            <Bed className="w-3 h-3 mr-2 text-gray-400" />
            Bed {bed?.bedNumber || 'N/A'}
          </div>
          <div className="flex items-center text-sm text-gray-500 mb-1">
            <Home className="w-3 h-3 mr-2 text-gray-400" />
            Room {room?.roomNumber || 'N/A'}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Building className="w-3 h-3 mr-2 text-gray-400" />
            {floor?.name || `Floor ${floor?.floorNumber}` || 'N/A'}
          </div>
        </div>
      );
    }
  }),
  
  columnTypes.text('rental', 'Rental Information', {
    cell: ({ row }) => {
      const rent = row.original.rent;
      const deposit = row.original.deposit;
      const moveInDate = row.original.moveInDate;
      
      return (
        <div>
          <div className="text-sm font-semibold text-primary-600 mb-1">
            ₹{rent?.toLocaleString() || '0'}/month
          </div>
          <div className="text-sm text-gray-500 mb-1">
            Deposit: ₹{deposit?.toLocaleString() || '0'}
          </div>
          {moveInDate && (
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(moveInDate).toLocaleDateString()}
            </div>
          )}
        </div>
      );
    }
  }),
  
  columnTypes.status('status', 'Status', statusConfigs.tenantStatus),
  
  columnTypes.actions([
    {
      icon: Edit,
      onClick: onEdit,
      title: 'Edit tenant',
      className: 'text-blue-600 hover:text-blue-900'
    },
    {
      icon: UserMinus,
      onClick: onVacate,
      title: 'Mark as vacated',
      className: 'text-orange-600 hover:text-orange-900',
      condition: (tenant) => tenant.status === 'ACTIVE'
    },
    {
      icon: Trash2,
      onClick: onDelete,
      title: 'Delete tenant',
      className: 'text-red-600 hover:text-red-900',
      variant: 'destructive'
    }
  ])
];

// Tenant card component
export const TenantCard = ({ data: tenant, onEdit, onDelete, onVacate, onAssignBed }) => {
  const bed = tenant.bed;
  const room = bed?.room;
  const floor = room?.floor;
  
  const statusConfig = statusConfigs.tenantStatus[tenant.status] || {
    color: 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border border-gray-200',
    icon: AlertCircle,
    label: tenant.status
  };
  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-elegant-lg transition-all duration-200 group h-full flex flex-col">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center shadow-elegant transition-all duration-200">
            <User className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{tenant.fullName}</h3>
            <p className="text-sm text-gray-500 font-medium">ID: {tenant.tenantId}</p>
          </div>
        </div>
        <div className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${statusConfig.color}`}>
          <StatusIcon className="w-3 h-3 mr-1.5" />
          <span>{statusConfig.label}</span>
        </div>
      </div>
      
      <div className="space-y-4 flex-1">
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
            <span className="text-sm font-medium text-gray-600">Phone:</span>
            <span className="text-sm font-semibold text-primary-600">{tenant.phone || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
            <span className="text-sm font-medium text-gray-600">Email:</span>
            <span className="text-sm font-semibold text-primary-600">{tenant.email || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
            <span className="text-sm font-medium text-gray-600">Rent:</span>
            <span className="text-sm font-semibold text-primary-600">₹{tenant.rent || 0}/month</span>
          </div>
        </div>
        
        {bed && (
          <div className="pt-4 border-t border-gray-200 mt-auto">
            <div className="text-sm font-medium text-gray-600 mb-3">Accommodation:</div>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-accent-100 to-accent-200 rounded-lg flex items-center justify-center">
                  <Bed className="w-4 h-4 text-accent-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    Bed {bed.bedNumber}
                  </div>
                  <div className="text-xs text-gray-500">
                    Room {room?.roomNumber} • {floor?.name || `Floor ${floor?.floorNumber}`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Action buttons at the bottom */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center space-x-2">
          {!tenant.bed && (
            <button
              onClick={() => onAssignBed && onAssignBed(tenant)}
              className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-success-50 to-success-100 text-success-700 text-xs font-semibold rounded-xl border border-success-200 hover:from-success-100 hover:to-success-200 transition-all duration-200"
              title="Assign bed"
            >
              <UserPlus className="w-3 h-3 mr-1.5" />
              Assign Bed
            </button>
          )}
          
          {tenant.status === 'ACTIVE' && (
            <button
              onClick={() => onVacate && onVacate(tenant)}
              className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-warning-50 to-warning-100 text-warning-700 text-xs font-semibold rounded-xl border border-warning-200 hover:from-warning-100 hover:to-warning-200 transition-all duration-200"
              title="Mark as vacated"
            >
              <UserMinus className="w-3 h-3 mr-1.5" />
              Mark Vacated
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit && onEdit(tenant)}
            className="p-2.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200"
            title="Edit tenant"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete && onDelete(tenant.id)}
            className="p-2.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded-xl transition-all duration-200"
            title="Delete tenant"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Main TenantTable component
export function TenantTable({ 
  tenants = [], 
  onEdit, 
  onDelete,
  onVacate,
  onAssignBed,
  viewMode = 'table',
  loading = false
}) {
  const columns = React.useMemo(
    () => createTenantColumns(onEdit, onDelete, onVacate),
    [onEdit, onDelete, onVacate]
  );

  return (
    <DataTable
      data={tenants}
      columns={columns}
      emptyMessage="No tenants found. Add tenants to start managing your PG residents."
      emptyIcon={User}
      viewMode={viewMode}
      cardComponent={(props) => <TenantCard {...props} onEdit={onEdit} onDelete={onDelete} onVacate={onVacate} onAssignBed={onAssignBed} />}
      loading={loading}
    />
  );
}

export default TenantTable;
