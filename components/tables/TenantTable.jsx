'use client';

import React from 'react';
import { DataTable, columnTypes, statusConfigs, iconConfigs } from '@/components/ui/DataTable';
import { createColumnHelper } from '@tanstack/react-table';
import { User, Edit, Trash2, Phone, Mail, MapPin, Calendar, Home, Building, Bed, UserPlus, UserMinus } from 'lucide-react';

const columnHelper = createColumnHelper();

// Tenant table columns
export const createTenantColumns = (onEdit, onDelete, onVacate) => [
  columnTypes.icon('fullName', 'Tenant', iconConfigs.tenantIcons, {
    meta: {
      headerClassName: 'w-[24%]',
      cellClassName: 'w-[24%]',
    },
    cell: ({ getValue, row }) => {
      const fullName = getValue();
      const tenantId = row.original.tenantId;
      
      return (
        <div className="flex min-w-[10.5rem] items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-sky-200/80 bg-sky-100/80 text-sky-700 shadow-[0_10px_20px_rgba(56,189,248,0.12)]">
            <User className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">{fullName}</div>
            <div className="mt-1 text-xs font-medium text-slate-500">ID: {tenantId}</div>
          </div>
        </div>
      );
    }
  }),
  
  columnTypes.text('contact', 'Contact', {
    meta: {
      headerClassName: 'w-[20%]',
      cellClassName: 'w-[20%]',
    },
    cell: ({ row }) => {
      const email = row.original.email;
      const phone = row.original.phone;
      
      return (
        <div className="min-w-[9rem] space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-slate-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-200/80 bg-emerald-50 text-emerald-700">
              <Phone className="h-3.5 w-3.5" />
            </span>
            <span className="font-medium">{phone || 'No phone'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-200/80 bg-violet-50 text-violet-700">
              <Mail className="h-3.5 w-3.5" />
            </span>
            <span className="truncate">{email || 'No email'}</span>
          </div>
        </div>
      );
    }
  }),
  
  columnTypes.text('accommodation', 'Stay', {
    meta: {
      headerClassName: 'w-[20%]',
      cellClassName: 'w-[20%]',
    },
    cell: ({ row }) => {
      const bed = row.original.bed;
      const room = bed?.room;
      const floor = room?.floor;
      
      return (
        <div className="min-w-[9.5rem] space-y-1.5">
          {bed ? (
            <>
              <div className="flex items-center gap-2 text-sm text-slate-900">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-sky-200/80 bg-sky-50 text-sky-700">
                  <Bed className="h-3.5 w-3.5" />
                </span>
                <span className="font-medium">Bed {bed?.bedNumber || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 text-slate-600">
                  <Home className="h-3.5 w-3.5" />
                </span>
                <span>Room {room?.roomNumber || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 text-slate-600">
                  <Building className="h-3.5 w-3.5" />
                </span>
                <span>{floor?.name || `Floor ${floor?.floorNumber}` || 'N/A'}</span>
              </div>
            </>
          ) : (
            <span className="inline-flex items-center rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              Bed not assigned
            </span>
          )}
        </div>
      );
    }
  }),
  
  columnTypes.text('rental', 'Rent', {
    meta: {
      headerClassName: 'w-[16%]',
      cellClassName: 'w-[16%]',
    },
    cell: ({ row }) => {
      const rent = row.original.rent;
      const deposit = row.original.deposit;
      const moveInDate = row.original.moveInDate;
      
      return (
        <div className="min-w-[8.5rem]">
          <div className="text-sm font-semibold text-slate-900 mb-1">
            ₹{rent?.toLocaleString() || '0'}/month
          </div>
          <div className="text-sm text-slate-500 mb-1">
            Deposit: ₹{deposit?.toLocaleString() || '0'}
          </div>
          {moveInDate && (
            <div className="flex items-center text-xs text-slate-500">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(moveInDate).toLocaleDateString()}
            </div>
          )}
        </div>
      );
    }
  }),
  
  columnTypes.status('status', 'Status', statusConfigs.tenantStatus, {
    meta: {
      headerClassName: 'w-[7rem]',
      cellClassName: 'w-[7rem]',
    },
  }),
  
  columnTypes.actions([
    {
      icon: Edit,
      onClick: onEdit,
      title: 'Edit tenant',
      className: 'text-sky-700 hover:text-sky-800 hover:bg-sky-50 hover:border-sky-200/80'
    },
    {
      icon: UserMinus,
      onClick: onVacate,
      title: 'Mark as vacated',
      className: 'text-amber-700 hover:text-amber-800 hover:bg-amber-50 hover:border-amber-200/80',
      condition: (tenant) => tenant.status === 'ACTIVE'
    },
    {
      icon: Trash2,
      onClick: onDelete,
      title: 'Delete tenant',
      className: 'text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200/80',
    }
  ], {
    meta: {
      headerClassName: 'w-[9rem] min-w-[9rem]',
      cellClassName: 'w-[9rem] min-w-[9rem]',
    },
  })
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
      tableClassName="w-full min-w-[760px] table-fixed"
      headerCellClassName="px-3.5 py-3"
      cellClassName="px-3.5 py-3"
      firstColumnClassName=""
      cardComponent={(props) => <TenantCard {...props} onEdit={onEdit} onDelete={onDelete} onVacate={onVacate} onAssignBed={onAssignBed} />}
      loading={loading}
    />
  );
}

export default TenantTable;
