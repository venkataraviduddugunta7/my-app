'use client';

import React from 'react';
import { DataTable, columnTypes, statusConfigs, iconConfigs } from '@/components/ui/DataTable';
import { createColumnHelper } from '@tanstack/react-table';
import { Home, Edit, Trash2, Building, Bed } from 'lucide-react';

const columnHelper = createColumnHelper();

// Room table columns
export const createRoomColumns = (onEdit, onDelete, onRowClick, floors = []) => [
  columnTypes.icon('roomNumber', 'Room Details', iconConfigs.roomIcons, {
    cell: ({ getValue, row }) => {
      const roomNumber = getValue();
      const name = row.original.name;
      
      return (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
            <Home className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              Room {roomNumber}
            </div>
            <div className="text-sm text-gray-500">
              {name || 'No name set'}
            </div>
          </div>
        </div>
      );
    }
  }),
  
  columnTypes.text('floorName', 'Floor', {
    cell: ({ row }) => {
      const floor = floors.find(f => f.id === row.original.floorId);
      return (
        <span className="text-sm text-gray-900">
          {floor?.name || floor?.floorName || `Floor ${floor?.floorNumber}` || 'Unknown'}
        </span>
      );
    }
  }),
  
  columnTypes.text('typeAndCapacity', 'Type & Capacity', {
    cell: ({ row }) => {
      const type = row.original.type;
      const capacity = row.original.capacity;
      return (
        <div>
          <div className="text-sm text-gray-900">{type}</div>
          <div className="text-sm text-gray-500">Max: {capacity} beds</div>
        </div>
      );
    }
  }),
  
  columnTypes.text('bedOccupancy', 'Bed Occupancy', {
    cell: ({ row }) => {
      const bedInfo = row.original.bedInfo || { total: 0, occupied: 0 };
      const capacity = row.original.capacity;
      const occupancyRate = bedInfo.total > 0 ? (bedInfo.occupied / bedInfo.total) * 100 : 0;
      const availableSlots = capacity - bedInfo.total;
      
      return (
        <div className="flex items-center space-x-3">
          <div>
            <div className="text-sm font-medium text-gray-900">
              {bedInfo.total}/{capacity} beds created
            </div>
            <div className="text-sm text-gray-500">
              {bedInfo.occupied} occupied, {bedInfo.total - bedInfo.occupied} vacant
            </div>
            {availableSlots > 0 && (
              <div className="text-xs text-green-600 font-medium">
                {availableSlots} slots available
              </div>
            )}
          </div>
          {bedInfo.total > 0 && (
            <div className="flex items-center">
              <div className="w-12 h-2 bg-gray-200 rounded-full mr-2">
                <div 
                  className="h-2 bg-blue-600 rounded-full" 
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{Math.round(occupancyRate)}%</span>
            </div>
          )}
        </div>
      );
    }
  }),
  
  columnTypes.text('amenities', 'Amenities', {
    cell: ({ getValue }) => {
      const amenities = getValue() || [];
      return (
        <div className="flex flex-wrap gap-1">
          {amenities.slice(0, 3).map((amenity, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {amenity}
            </span>
          ))}
          {amenities.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              +{amenities.length - 3} more
            </span>
          )}
          {amenities.length === 0 && (
            <span className="text-xs text-gray-400 italic">No amenities listed</span>
          )}
        </div>
      );
    }
  }),
  
  columnTypes.actions([
    {
      icon: Edit,
      onClick: onEdit,
      title: 'Edit room',
      className: 'text-blue-600 hover:text-blue-900'
    },
    {
      icon: Trash2,
      onClick: onDelete,
      title: 'Delete room',
      className: 'text-red-600 hover:text-red-900',
      variant: 'default',
      disabled: (room) => (room.bedInfo?.total || 0) > 0
    }
  ])
];

// Room card component
export const RoomCard = ({ data: room, onEdit, onDelete, onClick, floors = [] }) => {
  const floor = floors.find(f => f.id === room.floorId);
  const bedInfo = room.bedInfo || { total: 0, occupied: 0 };
  
  return (
    <div 
      className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-elegant-lg transition-all duration-200 cursor-pointer group h-full flex flex-col"
      onClick={() => onClick && onClick(room.id)}
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-xl flex items-center justify-center shadow-elegant transition-all duration-200">
            <Home className="w-6 h-6 text-secondary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">Room {room.roomNumber}</h3>
            <p className="text-sm text-gray-500 font-medium">{room.name || 'No name set'}</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4 flex-1">
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
            <span className="text-sm font-medium text-gray-600">Floor:</span>
            <span className="text-sm font-semibold text-primary-600">{floor?.name || 'Unknown'}</span>
          </div>
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
            <span className="text-sm font-medium text-gray-600">Type:</span>
            <span className="text-sm font-semibold text-primary-600">{room.type}</span>
          </div>
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
            <span className="text-sm font-medium text-gray-600">Beds:</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-primary-600">{bedInfo.occupied}/{bedInfo.total}</span>
              {bedInfo.total > 0 && (
                <span className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-success-50 to-success-100 text-success-700 text-xs font-semibold rounded-lg border border-success-200">
                  Click to view beds
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
            <span className="text-sm font-medium text-gray-600">Rent:</span>
            <span className="text-sm font-semibold text-primary-600">₹{room.rent || 0}/month</span>
          </div>
        </div>
        
        {room.amenities && room.amenities.length > 0 && (
          <div className="pt-4 border-t border-gray-200 mt-auto">
            <div className="text-sm font-medium text-gray-600 mb-3">Amenities:</div>
            <div className="flex flex-wrap gap-2">
              {room.amenities.slice(0, 3).map((amenity, index) => (
                <span key={index} className="inline-flex items-center px-2.5 py-1 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 text-xs font-medium rounded-lg border border-gray-200">
                  {amenity}
                </span>
              ))}
              {room.amenities.length > 3 && (
                <span className="text-xs text-gray-500 px-2 py-1">
                  +{room.amenities.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Action buttons at the bottom */}
      <div className="flex items-center justify-end space-x-2 mt-6 pt-4 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onEdit(room)}
          className="p-2.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200"
          title="Edit room"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(room.id)}
          disabled={bedInfo.total > 0}
          className="p-2.5 text-gray-400 rounded-xl transition-all duration-200"
          title="Delete room"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Main RoomTable component
export function RoomTable({ 
  rooms = [], 
  onEdit, 
  onDelete, 
  onClick,
  viewMode = 'table',
  searchTerm = '',
  onSearchChange,
  floors = [],
  loading = false
}) {
  // Add bed info to rooms
  const roomsWithBedInfo = React.useMemo(() => {
    return rooms.map(room => ({
      ...room,
      bedInfo: {
        total: room.beds?.length || 0,
        occupied: room.beds?.filter(bed => bed.status === 'Occupied').length || 0
      }
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
      searchable={true}
      searchPlaceholder="Search rooms by number, name, type, floor, or amenities..."
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
