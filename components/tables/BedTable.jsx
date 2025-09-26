'use client';

import React from 'react';
import { DataTable, columnTypes, statusConfigs, iconConfigs } from '@/components/ui/DataTable';
import { createColumnHelper } from '@tanstack/react-table';
import { Bed, Edit, Trash2, Home, Building, User, CheckCircle, AlertCircle } from 'lucide-react';

const columnHelper = createColumnHelper();

// Bed table columns
export const createBedColumns = (onEdit, onDelete, rooms = [], floors = []) => [
  columnTypes.icon('bedNumber', 'Bed Details', iconConfigs.bedIcons, {
    cell: ({ getValue, row }) => {
      const bedNumber = getValue();
      const description = row.original.description;
      
      return (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
            <Bed className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              Bed {bedNumber}
            </div>
            <div className="text-sm text-gray-500">
              {description || 'Standard bed'}
            </div>
          </div>
        </div>
      );
    }
  }),
  
  columnTypes.text('roomAndFloor', 'Room & Floor', {
    cell: ({ row }) => {
      const room = rooms.find(r => r.id === row.original.roomId);
      const floor = floors.find(f => f.id === room?.floorId);
      
      return (
        <div>
          <div className="text-sm text-gray-900">
            Room {room?.roomNumber || 'Unknown'}
          </div>
          <div className="text-sm text-gray-500">
            {floor?.name || floor?.floorName || `Floor ${floor?.floorNumber}` || 'Unknown Floor'}
          </div>
          {room?.amenities && room.amenities.length > 0 && (
            <div className="text-xs text-gray-400 mt-1">
              {room.amenities.slice(0, 2).join(', ')}
              {room.amenities.length > 2 && ` +${room.amenities.length - 2} more`}
            </div>
          )}
        </div>
      );
    }
  }),
  
  columnTypes.text('typeAndStatus', 'Type & Status', {
    cell: ({ row }) => {
      const bedType = row.original.bedType;
      const status = row.original.status;
      
      const statusConfig = statusConfigs.bedStatus[status] || {
        color: 'bg-gray-100 text-gray-800',
        icon: AlertCircle,
        label: status
      };
      const StatusIcon = statusConfig.icon;
      
      return (
        <div>
          <div className="text-sm text-gray-900 mb-1">{bedType} Bed</div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusConfig.label}
          </span>
        </div>
      );
    }
  }),
  
  columnTypes.currency('rent', 'Rent & Deposit', {
    cell: ({ row }) => {
      const rent = row.original.rent;
      const deposit = row.original.deposit;
      
      return (
        <div>
          <div className="text-sm font-medium text-gray-900">
            ₹{rent?.toLocaleString() || '0'}/month
          </div>
          <div className="text-sm text-gray-500">
            ₹{deposit?.toLocaleString() || '0'} deposit
          </div>
          {row.original.status === 'Available' && (
            <div className="text-xs text-green-600 font-medium mt-1">
              Available for rent
            </div>
          )}
        </div>
      );
    }
  }),
  
  columnTypes.text('tenant', 'Tenant', {
    cell: ({ row }) => {
      const tenant = row.original.tenant;
      
      if (tenant) {
        return (
          <div>
            <div className="text-sm font-medium text-gray-900">
              {tenant.fullName || tenant.name}
            </div>
            <div className="text-sm text-gray-500">
              {tenant.phone || 'No phone'}
            </div>
          </div>
        );
      } else {
        return (
          <div className="text-sm text-gray-400 italic">
            {row.original.status === 'Available' ? 'No tenant' : 'Vacant'}
          </div>
        );
      }
    }
  }),
  
  columnTypes.actions([
    {
      icon: Edit,
      onClick: onEdit,
      title: 'Edit bed',
      className: 'text-blue-600 hover:text-blue-900'
    },
    {
      icon: Trash2,
      onClick: (bed) => onDelete(bed.id),
      title: 'Delete bed',
      className: 'text-red-600 hover:text-red-900',
      variant: 'default',
      size: 'sm',
      disabled: (bed) => bed.status === 'Occupied'
    }
  ])
];

// Bed card component
export const BedCard = ({ data: bed, onEdit, onDelete, rooms = [], floors = [] }) => {
  const room = rooms.find(r => r.id === bed.roomId);
  const floor = floors.find(f => f.id === room?.floorId);
  
  const statusConfig = statusConfigs.bedStatus[bed.status] || {
    color: 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border border-gray-200',
    icon: AlertCircle,
    label: bed.status
  };
  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-elegant-lg transition-all duration-200 group h-full flex flex-col">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-accent-100 to-accent-200 rounded-xl flex items-center justify-center shadow-elegant transition-all duration-200">
            <Bed className="w-6 h-6 text-accent-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">Bed {bed.bedNumber}</h3>
            <p className="text-sm text-gray-500 font-medium">{bed.bedType} Bed</p>
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
            <span className="text-sm font-medium text-gray-600">Room:</span>
            <span className="text-sm font-semibold text-primary-600">{room?.roomNumber || 'Unknown'}</span>
          </div>
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
            <span className="text-sm font-medium text-gray-600">Floor:</span>
            <span className="text-sm font-semibold text-primary-600">{floor?.name || floor?.floorName || `Floor ${floor?.floorNumber}` || 'Unknown Floor'}</span>
          </div>
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
            <span className="text-sm font-medium text-gray-600">Rent:</span>
            <span className="text-sm font-semibold text-primary-600">₹{bed.rent || 0}/month</span>
          </div>
        </div>
        
        {bed.tenant && (
          <div className="pt-4 border-t border-gray-200 mt-auto">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-secondary-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {bed.tenant.fullName || bed.tenant.name}
                </div>
                <div className="text-xs text-gray-500">
                  {bed.tenant.phone || 'No phone'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Action buttons at the bottom */}
      <div className="flex items-center justify-end space-x-2 mt-6 pt-4 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onEdit(bed)}
          className="p-2.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200"
          title="Edit bed"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(bed.id)}
          disabled={bed.status === 'Occupied'}
          variant="primary"
          size="sm"
          className="p-2.5 text-gray-400 rounded-xl transition-all duration-200"
          title="Delete bed"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Main BedTable component
export function BedTable({ 
  beds = [], 
  onEdit, 
  onDelete,
  viewMode = 'table',
  searchTerm = '',
  onSearchChange,
  rooms = [],
  floors = [],
  loading = false
}) {
  const columns = React.useMemo(
    () => createBedColumns(onEdit, onDelete, rooms, floors),
    [onEdit, onDelete, rooms, floors]
  );

  return (
    <DataTable
      data={beds}
      columns={columns}
      searchable={false}
      searchPlaceholder="Search beds by number, type, status, room, or tenant..."
      emptyMessage="No beds found. Add beds to your rooms to manage individual tenant assignments."
      emptyIcon={Bed}
      viewMode={viewMode}
      cardComponent={(props) => <BedCard {...props} rooms={rooms} floors={floors} onEdit={onEdit} onDelete={onDelete} />}
      loading={loading}
    />
  );
}

export default BedTable;
