'use client';

import React from 'react';
import { DataTable, columnTypes } from '@/components/ui/DataTable';
import { Home, Edit, Trash2, Building, Bed, Sparkles } from 'lucide-react';

const normalizeBedStatus = (status) => String(status || '').toUpperCase();

export const createRoomColumns = (onEdit, onDelete, onRowClick, floors = []) => [
  columnTypes.icon('roomNumber', 'Room', {}, {
    meta: {
      headerClassName: 'w-[24%]',
      cellClassName: 'w-[24%]',
    },
    cell: ({ getValue, row }) => {
      const roomNumber = getValue();
      const name = row.original.name;

      return (
        <div className="flex min-w-[11rem] items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-sky-200/80 bg-sky-100/80 text-sky-700 shadow-[0_10px_20px_rgba(56,189,248,0.12)]">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Room {roomNumber}</div>
            <div className="mt-1 text-xs font-medium text-slate-500">{name || 'No room label'}</div>
          </div>
        </div>
      );
    },
  }),

  columnTypes.text('floorName', 'Floor', {
    meta: {
      headerClassName: 'w-[16%]',
      cellClassName: 'w-[16%]',
    },
    cell: ({ row }) => {
      const floor = floors.find((item) => item.id === row.original.floorId);

      return (
        <div className="min-w-[8rem]">
          <div className="text-sm font-semibold text-slate-900">{floor?.name || floor?.floorName || `Floor ${floor?.floorNumber}` || 'Unknown floor'}</div>
          <div className="mt-1 text-xs text-slate-500">Room placement</div>
        </div>
      );
    },
  }),

  columnTypes.text('typeAndCapacity', 'Type', {
    meta: {
      headerClassName: 'w-[17%]',
      cellClassName: 'w-[17%]',
    },
    cell: ({ row }) => {
      const type = row.original.type;
      const capacity = row.original.capacity;

      return (
        <div className="min-w-[9rem]">
          <div className="text-sm font-semibold text-slate-900">{type}</div>
          <div className="mt-1 text-xs text-slate-500">Capacity: {capacity} bed{capacity === 1 ? '' : 's'}</div>
        </div>
      );
    },
  }),

  columnTypes.text('bedOccupancy', 'Occupancy', {
    meta: {
      headerClassName: 'w-[22%]',
      cellClassName: 'w-[22%]',
    },
    cell: ({ row }) => {
      const bedInfo = row.original.bedInfo || { total: 0, occupied: 0 };
      const capacity = row.original.capacity || 0;
      const occupancyRate = bedInfo.total > 0 ? (bedInfo.occupied / bedInfo.total) * 100 : 0;
      const openSlots = Math.max(capacity - bedInfo.total, 0);

      return (
        <div className="min-w-[12rem]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-slate-900">{bedInfo.occupied}/{bedInfo.total || 0} occupied</span>
            <span className="text-xs font-medium text-slate-500">{Math.round(occupancyRate)}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,#0f172a,#38bdf8)]" style={{ width: `${Math.max(occupancyRate, bedInfo.total > 0 ? 8 : 0)}%` }} />
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {bedInfo.total} bed{bedInfo.total === 1 ? '' : 's'} created • {openSlots} slot{openSlots === 1 ? '' : 's'} open to configure
          </div>
        </div>
      );
    },
  }),

  columnTypes.text('amenities', 'Amenities', {
    meta: {
      headerClassName: 'w-[13%]',
      cellClassName: 'w-[13%]',
    },
    cell: ({ getValue }) => {
      const amenities = getValue() || [];

      if (!amenities.length) {
        return <span className="text-xs text-slate-400">No amenities</span>;
      }

      return (
        <div className="flex flex-wrap gap-1.5">
          {amenities.slice(0, 2).map((amenity, index) => (
            <span
              key={index}
              className="inline-flex items-center rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
            >
              {amenity}
            </span>
          ))}
          {amenities.length > 2 ? (
            <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-medium text-slate-500">
              +{amenities.length - 2}
            </span>
          ) : null}
        </div>
      );
    },
  }),

  columnTypes.actions([
    {
      icon: Edit,
      onClick: onEdit,
      title: 'Edit room',
      className: 'text-sky-700 hover:text-sky-800 hover:bg-sky-50 hover:border-sky-200/80',
    },
    {
      icon: Trash2,
      onClick: (room) => onDelete(room.id),
      title: 'Delete room',
      className: 'text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200/80',
      disabled: (room) => (room.bedInfo?.total || 0) > 0,
    },
  ], {
    meta: {
      headerClassName: 'w-[10rem] min-w-[10rem]',
      cellClassName: 'w-[10rem] min-w-[10rem]',
    },
  }),
];

export const RoomCard = ({ data: room, onEdit, onDelete, onClick, floors = [] }) => {
  const floor = floors.find((item) => item.id === room.floorId);
  const bedInfo = room.bedInfo || { total: 0, occupied: 0 };
  const openSlots = Math.max((room.capacity || 0) - bedInfo.total, 0);

  return (
    <div
      className="group flex h-full cursor-pointer flex-col rounded-[1.75rem] border border-slate-200/80 bg-white/92 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(15,23,42,0.08)]"
      onClick={() => onClick && onClick(room.id)}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1.15rem] border border-sky-200/80 bg-sky-100/80 text-sky-700 shadow-[0_12px_24px_rgba(56,189,248,0.14)]">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-950">Room {room.roomNumber}</h3>
            <p className="text-sm font-medium text-slate-500">{room.name || 'No room label'}</p>
          </div>
        </div>
        <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          {room.type}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Floor</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{floor?.name || floor?.floorName || `Floor ${floor?.floorNumber}` || 'Unknown floor'}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Capacity</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{room.capacity} bed{room.capacity === 1 ? '' : 's'}</p>
        </div>
      </div>

      <div className="mt-5 flex-1 rounded-[1.35rem] border border-slate-200/80 bg-white/85 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">Bed setup</p>
          <span className="rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            {openSlots} open
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Created beds</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{bedInfo.total}</p>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Occupied</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{bedInfo.occupied}</p>
          </div>
        </div>

        {room.amenities?.length ? (
          <div className="mt-4">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-slate-400" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Amenities</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {room.amenities.slice(0, 3).map((amenity, index) => (
                <span key={index} className="inline-flex items-center rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {amenity}
                </span>
              ))}
              {room.amenities.length > 3 ? <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-medium text-slate-500">+{room.amenities.length - 3}</span> : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-200/80 pt-4" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onEdit(room)}
          className="rounded-xl p-2.5 text-slate-400 transition-all duration-200 hover:bg-sky-50 hover:text-sky-700"
          title="Edit room"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(room.id)}
          disabled={bedInfo.total > 0}
          className="rounded-xl p-2.5 text-slate-400 transition-all duration-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          title="Delete room"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export function RoomTable({
  rooms = [],
  onEdit,
  onDelete,
  onClick,
  viewMode = 'table',
  floors = [],
  loading = false,
}) {
  const roomsWithBedInfo = React.useMemo(() => {
    return rooms.map((room) => ({
      ...room,
      bedInfo: {
        total: room.beds?.length || 0,
        occupied: room.beds?.filter((bed) => normalizeBedStatus(bed.status) === 'OCCUPIED').length || 0,
      },
    }));
  }, [rooms]);

  const columns = React.useMemo(
    () => createRoomColumns(onEdit, onDelete, onClick, floors),
    [onEdit, onDelete, onClick, floors]
  );

  return (
    <DataTable
      data={roomsWithBedInfo}
      columns={columns}
      tableClassName="w-full min-w-[860px] table-fixed"
      firstColumnClassName=""
      emptyMessage="No rooms found. Add rooms to your floors to start managing accommodations."
      emptyIcon={Home}
      onRowClick={onClick}
      viewMode={viewMode}
      cardComponent={(props) => <RoomCard {...props} floors={floors} onEdit={onEdit} onDelete={onDelete} onClick={onClick} />}
      loading={loading}
    />
  );
}

export default RoomTable;
