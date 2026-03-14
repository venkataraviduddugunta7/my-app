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
    }
  ])
];

// Tenant card component
export const TenantCard = ({ data: tenant, onEdit, onDelete, onVacate, onAssignBed }) => {
  const bed = tenant.bed;
  const room = bed?.room;
  const floor = room?.floor;
  const statusTone = {
    ACTIVE: 'border-emerald-200/80 bg-emerald-50 text-emerald-700',
    VACATED: 'border-slate-200/80 bg-slate-50 text-slate-700',
    PENDING: 'border-amber-200/80 bg-amber-50 text-amber-700',
  }[tenant.status] || 'border-slate-200/80 bg-slate-50 text-slate-700';

  return (
    <div className="group flex h-full flex-col rounded-[1.75rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(15,23,42,0.08)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1.15rem] border border-sky-200/80 bg-sky-100/80 text-sky-700 shadow-[0_12px_24px_rgba(56,189,248,0.14)]">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-950">{tenant.fullName}</h3>
            <p className="text-sm font-medium text-slate-500">ID: {tenant.tenantId}</p>
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone}`}>
          {tenant.status}
        </span>
      </div>
      
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Phone</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{tenant.phone || 'Not added'}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Email</p>
          <p className="mt-2 truncate text-sm font-medium text-slate-900">{tenant.email || 'Not added'}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Monthly rent</p>
          <p className="mt-2 text-sm font-medium text-slate-900">₹{tenant.rent || 0}/month</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Move-in date</p>
          <p className="mt-2 text-sm font-medium text-slate-900">
            {tenant.moveInDate ? new Date(tenant.moveInDate).toLocaleDateString() : 'Not assigned'}
          </p>
        </div>
      </div>

      <div className="mt-5 flex-1 rounded-[1.35rem] border border-slate-200/80 bg-white/85 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">Accommodation</p>
          {!bed ? (
            <span className="rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
              Bed not assigned
            </span>
          ) : null}
        </div>

        {bed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-200/80 bg-sky-100/80 text-sky-700">
                <Bed className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Bed {bed.bedNumber}</p>
                <p className="text-xs text-slate-500">{bed.bedType}</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Room</p>
                <p className="mt-1 text-sm font-medium text-slate-900">Room {room?.roomNumber || 'N/A'}</p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Floor</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{floor?.name || `Floor ${floor?.floorNumber || 'N/A'}`}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Use the assign-bed action to place this tenant into live occupancy.
          </p>
        )}
      </div>
      
      <div className="mt-6 flex items-center justify-between border-t border-slate-200/80 pt-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          {!tenant.bed && (
            <button
              onClick={() => onAssignBed && onAssignBed(tenant)}
              className="inline-flex items-center rounded-xl border border-sky-200/80 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-100"
              title="Assign bed"
            >
              <UserPlus className="w-3 h-3 mr-1.5" />
              Assign Bed
            </button>
          )}
          
          {tenant.status === 'ACTIVE' && (
            <button
              onClick={() => onVacate && onVacate(tenant)}
              className="inline-flex items-center rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100"
              title="Mark as vacated"
            >
              <UserMinus className="w-3 h-3 mr-1.5" />
              Mark Vacated
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit && onEdit(tenant)}
            className="rounded-xl p-2.5 text-slate-400 transition-all duration-200 hover:bg-sky-50 hover:text-sky-700"
            title="Edit tenant"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete && onDelete(tenant)}
            className="rounded-xl p-2.5 text-slate-400 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
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
