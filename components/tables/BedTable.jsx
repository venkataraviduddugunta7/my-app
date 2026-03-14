'use client';

import React from 'react';
import { DataTable, columnTypes, statusConfigs } from '@/components/ui/DataTable';
import { Bed, Edit, Trash2, User, AlertCircle, Home, Building } from 'lucide-react';

const normalizeStatus = (status) => String(status || '').toUpperCase();

export const createBedColumns = (onEdit, onDelete, rooms = [], floors = []) => [
  columnTypes.icon('bedNumber', 'Bed', {}, {
    meta: {
      headerClassName: 'w-[22%]',
      cellClassName: 'w-[22%]',
    },
    cell: ({ getValue, row }) => {
      const bedNumber = getValue();
      const description = row.original.description;

      return (
        <div className="flex min-w-[10rem] items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-sky-200/80 bg-sky-100/80 text-sky-700 shadow-[0_10px_20px_rgba(56,189,248,0.12)]">
            <Bed className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Bed {bedNumber}</div>
            <div className="mt-1 text-xs font-medium text-slate-500">{description || 'Standard bed setup'}</div>
          </div>
        </div>
      );
    },
  }),

  columnTypes.text('roomAndFloor', 'Stay', {
    meta: {
      headerClassName: 'w-[22%]',
      cellClassName: 'w-[22%]',
    },
    cell: ({ row }) => {
      const room = rooms.find((item) => item.id === row.original.roomId);
      const floor = floors.find((item) => item.id === room?.floorId);

      return (
        <div className="min-w-[11rem] space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-slate-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-sky-200/80 bg-sky-50 text-sky-700">
              <Home className="h-3.5 w-3.5" />
            </span>
            <span className="font-medium">Room {room?.roomNumber || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 text-slate-600">
              <Building className="h-3.5 w-3.5" />
            </span>
            <span>{floor?.name || floor?.floorName || `Floor ${floor?.floorNumber}` || 'Unknown floor'}</span>
          </div>
        </div>
      );
    },
  }),

  columnTypes.text('typeAndStatus', 'Type', {
    meta: {
      headerClassName: 'w-[18%]',
      cellClassName: 'w-[18%]',
    },
    cell: ({ row }) => {
      const bedType = row.original.bedType;
      const status = normalizeStatus(row.original.status);
      const statusConfig = statusConfigs.bedStatus[status] || {
        color: 'border-slate-200/80 bg-slate-50 text-slate-600',
        icon: AlertCircle,
        label: row.original.status || 'Unknown',
      };
      const StatusIcon = statusConfig.icon;

      return (
        <div className="min-w-[9rem]">
          <div className="text-sm font-semibold text-slate-900">{bedType} bed</div>
          <span className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusConfig.color}`}>
            <StatusIcon className="mr-1.5 h-3 w-3" />
            {statusConfig.label}
          </span>
        </div>
      );
    },
  }),

  columnTypes.text('rent', 'Pricing', {
    meta: {
      headerClassName: 'w-[18%]',
      cellClassName: 'w-[18%]',
    },
    cell: ({ row }) => {
      const rent = row.original.rent;
      const deposit = row.original.deposit;

      return (
        <div className="min-w-[9rem]">
          <div className="text-sm font-semibold text-slate-900">₹{rent?.toLocaleString() || '0'}/month</div>
          <div className="mt-1 text-xs text-slate-500">Deposit: ₹{deposit?.toLocaleString() || '0'}</div>
        </div>
      );
    },
  }),

  columnTypes.text('tenant', 'Tenant', {
    meta: {
      headerClassName: 'w-[20%]',
      cellClassName: 'w-[20%]',
    },
    cell: ({ row }) => {
      const tenant = row.original.tenant;

      if (!tenant) {
        return (
          <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
            No tenant assigned
          </span>
        );
      }

      return (
        <div className="min-w-[10rem] space-y-1">
          <div className="text-sm font-semibold text-slate-900">{tenant.fullName || tenant.name}</div>
          <div className="text-xs text-slate-500">{tenant.phone || 'No phone added'}</div>
        </div>
      );
    },
  }),

  columnTypes.actions([
    {
      icon: Edit,
      onClick: onEdit,
      title: 'Edit bed',
      className: 'text-sky-700 hover:text-sky-800 hover:bg-sky-50 hover:border-sky-200/80',
    },
    {
      icon: Trash2,
      onClick: (bed) => onDelete(bed.id),
      title: 'Delete bed',
      className: 'text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200/80',
      disabled: (bed) => normalizeStatus(bed.status) === 'OCCUPIED',
    },
  ], {
    meta: {
      headerClassName: 'w-[10rem] min-w-[10rem]',
      cellClassName: 'w-[10rem] min-w-[10rem]',
    },
  }),
];

export const BedCard = ({ data: bed, onEdit, onDelete, rooms = [], floors = [] }) => {
  const room = rooms.find((item) => item.id === bed.roomId);
  const floor = floors.find((item) => item.id === room?.floorId);
  const status = normalizeStatus(bed.status);
  const statusConfig = statusConfigs.bedStatus[status] || {
    color: 'border-slate-200/80 bg-slate-50 text-slate-600',
    icon: AlertCircle,
    label: bed.status || 'Unknown',
  };
  const StatusIcon = statusConfig.icon;

  return (
    <div className="group flex h-full flex-col rounded-[1.75rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(15,23,42,0.08)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1.15rem] border border-sky-200/80 bg-sky-100/80 text-sky-700 shadow-[0_12px_24px_rgba(56,189,248,0.14)]">
            <Bed className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-950">Bed {bed.bedNumber}</h3>
            <p className="text-sm font-medium text-slate-500">{bed.bedType} bed</p>
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusConfig.color}`}>
          <StatusIcon className="mr-1.5 h-3 w-3" />
          {statusConfig.label}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Room</p>
          <p className="mt-2 text-sm font-medium text-slate-900">Room {room?.roomNumber || 'Unknown'}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Floor</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{floor?.name || floor?.floorName || `Floor ${floor?.floorNumber}` || 'Unknown floor'}</p>
        </div>
      </div>

      <div className="mt-5 flex-1 rounded-[1.35rem] border border-slate-200/80 bg-white/85 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Rent</p>
            <p className="mt-1 text-sm font-medium text-slate-900">₹{bed.rent || 0}/month</p>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Deposit</p>
            <p className="mt-1 text-sm font-medium text-slate-900">₹{bed.deposit || 0}</p>
          </div>
        </div>

        {bed.tenant ? (
          <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{bed.tenant.fullName || bed.tenant.name}</p>
                <p className="text-xs text-slate-500">{bed.tenant.phone || 'No phone added'}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200/80 bg-slate-50/50 px-3 py-3 text-sm text-slate-500">
            This bed is open for assignment.
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-200/80 pt-4" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onEdit(bed)}
          className="rounded-xl p-2.5 text-slate-400 transition-all duration-200 hover:bg-sky-50 hover:text-sky-700"
          title="Edit bed"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(bed.id)}
          disabled={status === 'OCCUPIED'}
          className="rounded-xl p-2.5 text-slate-400 transition-all duration-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          title="Delete bed"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export function BedTable({
  beds = [],
  onEdit,
  onDelete,
  viewMode = 'table',
  rooms = [],
  floors = [],
  loading = false,
}) {
  const columns = React.useMemo(
    () => createBedColumns(onEdit, onDelete, rooms, floors),
    [onEdit, onDelete, rooms, floors]
  );

  return (
    <DataTable
      data={beds}
      columns={columns}
      tableClassName="w-full min-w-[900px] table-fixed"
      firstColumnClassName=""
      emptyMessage="No beds found. Add beds to your rooms to manage individual tenant assignments."
      emptyIcon={Bed}
      viewMode={viewMode}
      cardComponent={(props) => <BedCard {...props} rooms={rooms} floors={floors} onEdit={onEdit} onDelete={onDelete} />}
      loading={loading}
    />
  );
}

export default BedTable;
