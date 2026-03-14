'use client';

import React from 'react';
import { DataTable, columnTypes } from '@/components/ui/DataTable';
import { Building, Edit, Trash2, Layers3 } from 'lucide-react';

const formatFloorLabel = (floorNumber) => {
  if (floorNumber === 0) return 'Ground floor';
  if (floorNumber === 1) return '1st floor';
  if (floorNumber === 2) return '2nd floor';
  if (floorNumber === 3) return '3rd floor';
  if (floorNumber === undefined || floorNumber === null) return 'Floor';
  return `${floorNumber}th floor`;
};

export const createFloorColumns = (onEdit, onDelete, onRowClick) => [
  columnTypes.icon('name', 'Floor', {}, {
    meta: {
      headerClassName: 'w-[28%]',
      cellClassName: 'w-[28%]',
    },
    cell: ({ getValue, row }) => {
      const name = getValue();
      const floorNumber = row.original.floorNumber;

      return (
        <div className="flex min-w-[11rem] items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-sky-200/80 bg-sky-100/80 text-sky-700 shadow-[0_10px_20px_rgba(56,189,248,0.12)]">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">{name || `Floor ${floorNumber}`}</div>
            <div className="mt-1 text-xs font-medium text-slate-500">{formatFloorLabel(floorNumber)}</div>
          </div>
        </div>
      );
    },
  }),

  columnTypes.badge('floorNumber', 'Level', {
    0: { color: 'border-sky-200/80 bg-sky-50 text-sky-700', label: 'Ground floor' },
    1: { color: 'border-emerald-200/80 bg-emerald-50 text-emerald-700', label: '1st floor' },
    2: { color: 'border-violet-200/80 bg-violet-50 text-violet-700', label: '2nd floor' },
    3: { color: 'border-amber-200/80 bg-amber-50 text-amber-700', label: '3rd floor' },
  }, {
    meta: {
      headerClassName: 'w-[16%]',
      cellClassName: 'w-[16%]',
    },
  }),

  columnTypes.text('roomCount', 'Rooms', {
    meta: {
      headerClassName: 'w-[22%]',
      cellClassName: 'w-[22%]',
    },
    cell: ({ row }) => {
      const roomCount = row.original.roomCount || 0;

      return (
        <div className="min-w-[9rem]">
          <div className="text-sm font-semibold text-slate-900">{roomCount} room{roomCount === 1 ? '' : 's'}</div>
          <div className="mt-1 text-xs text-slate-500">
            {roomCount > 0 ? 'Open to see rooms on this floor' : 'No rooms added yet'}
          </div>
        </div>
      );
    },
  }),

  columnTypes.text('description', 'Notes', {
    meta: {
      headerClassName: 'w-[24%]',
      cellClassName: 'w-[24%]',
    },
    cell: ({ getValue }) => (
      <div className="max-w-[16rem] text-sm text-slate-600">
        <span className="line-clamp-2">{getValue() || 'No notes added'}</span>
      </div>
    ),
  }),

  columnTypes.actions([
    {
      icon: Edit,
      onClick: onEdit,
      title: 'Edit floor',
      className: 'text-sky-700 hover:text-sky-800 hover:bg-sky-50 hover:border-sky-200/80',
    },
    {
      icon: Trash2,
      onClick: (floor) => onDelete(floor.id),
      title: 'Delete floor',
      className: 'text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200/80',
      disabled: (floor) => (floor.roomCount || 0) > 0,
    },
  ], {
    meta: {
      headerClassName: 'w-[10rem] min-w-[10rem]',
      cellClassName: 'w-[10rem] min-w-[10rem]',
    },
  }),
];

export const FloorCard = ({ data: floor, onEdit, onDelete, onClick }) => {
  const roomCount = floor.roomCount || 0;

  return (
    <div
      className="group flex h-full cursor-pointer flex-col rounded-[1.75rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(15,23,42,0.08)]"
      onClick={() => onClick && onClick(floor.id)}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1.15rem] border border-sky-200/80 bg-sky-100/80 text-sky-700 shadow-[0_12px_24px_rgba(56,189,248,0.14)]">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-950">{floor.name || `Floor ${floor.floorNumber}`}</h3>
            <p className="text-sm font-medium text-slate-500">{formatFloorLabel(floor.floorNumber)}</p>
          </div>
        </div>
        <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          {roomCount} room{roomCount === 1 ? '' : 's'}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Level</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{formatFloorLabel(floor.floorNumber)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Rooms</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{roomCount} configured</p>
        </div>
      </div>

      <div className="mt-5 flex-1 rounded-[1.35rem] border border-slate-200/80 bg-white/85 p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-slate-600">
            <Layers3 className="h-4 w-4" />
          </div>
          <p className="text-sm font-semibold text-slate-900">Floor notes</p>
        </div>
        <p className="text-sm leading-6 text-slate-500">
          {floor.description || 'Use this floor to group rooms cleanly and move into room setup from here.'}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-200/80 pt-4" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onEdit(floor)}
          className="rounded-xl p-2.5 text-slate-400 transition-all duration-200 hover:bg-sky-50 hover:text-sky-700"
          title="Edit floor"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(floor.id)}
          disabled={roomCount > 0}
          className="rounded-xl p-2.5 text-slate-400 transition-all duration-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          title="Delete floor"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export function FloorTable({
  floors = [],
  onEdit,
  onDelete,
  onClick,
  viewMode = 'table',
  loading = false,
}) {
  const columns = React.useMemo(
    () => createFloorColumns(onEdit, onDelete, onClick),
    [onEdit, onDelete, onClick]
  );

  return (
    <DataTable
      data={floors}
      columns={columns}
      tableClassName="w-full min-w-[760px] table-fixed"
      firstColumnClassName=""
      emptyMessage="No floors found. Add floors to start organizing your property structure."
      emptyIcon={Building}
      onRowClick={onClick}
      viewMode={viewMode}
      cardComponent={(props) => <FloorCard {...props} onEdit={onEdit} onDelete={onDelete} onClick={onClick} />}
      loading={loading}
    />
  );
}

export default FloorTable;
