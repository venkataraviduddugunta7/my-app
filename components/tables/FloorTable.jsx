'use client';

import React from 'react';
import { DataTable, columnTypes, statusConfigs, iconConfigs } from '@/components/ui/DataTable';
import { createColumnHelper } from '@tanstack/react-table';
import { Building, Edit, Trash2, Home } from 'lucide-react';

const columnHelper = createColumnHelper();

// Floor table columns
export const createFloorColumns = (onEdit, onDelete, onRowClick) => [
  columnTypes.icon('name', 'Floor Details', iconConfigs.floorIcons, {
    cell: ({ getValue, row }) => {
      const name = getValue();
      const floorNumber = row.original.floorNumber;
      
      return (
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
            <Building className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {name || `Floor ${floorNumber}`}
            </div>
            <div className="text-sm text-gray-500">
              Floor {floorNumber}
            </div>
          </div>
        </div>
      );
    }
  }),
  
  columnTypes.badge('floorNumber', 'Floor Number', {
    [0]: { color: 'bg-blue-100 text-blue-800', label: 'Ground Floor' },
    [1]: { color: 'bg-green-100 text-green-800', label: '1st Floor' },
    [2]: { color: 'bg-purple-100 text-purple-800', label: '2nd Floor' },
    [3]: { color: 'bg-orange-100 text-orange-800', label: '3rd Floor' },
  }),
  
  columnTypes.text('roomCount', 'Rooms Count', {
    cell: ({ row }) => {
      const roomCount = row.original.roomCount || 0;
      return (
        <div className="flex items-center">
          <div className="text-sm text-gray-900">{roomCount} rooms</div>
          {roomCount > 0 && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
              Click to view
            </span>
          )}
        </div>
      );
    }
  }),
  
  columnTypes.text('description', 'Description', {
    cell: ({ getValue }) => (
      <div className="text-sm text-gray-900 max-w-xs truncate">
        {getValue() || 'No description'}
      </div>
    )
  }),
  
  columnTypes.actions([
    {
      icon: Edit,
      onClick: onEdit,
      title: 'Edit floor',
      className: 'text-blue-600 hover:text-blue-900'
    },
    {
      icon: Trash2,
      onClick: onDelete,
      title: 'Delete floor',
      className: 'text-red-600 hover:text-red-900',
      variant: 'default',
      size: 'sm',
      disabled: (floor) => (floor.roomCount || 0) > 0
    }
  ])
];

// Floor card component
export const FloorCard = ({ data: floor, onEdit, onDelete, onClick }) => {
  const roomCount = floor.roomCount || 0;
  
  return (
    <div 
      className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-elegant-lg transition-all duration-200 cursor-pointer group h-full flex flex-col"
      onClick={() => onClick && onClick(floor.id)}
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center shadow-elegant transition-all duration-200">
            <Building className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{floor.name || `Floor ${floor.floorNumber}`}</h3>
            <p className="text-sm text-gray-500 font-medium">Floor {floor.floorNumber}</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4 flex-1">
        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
          <span className="text-sm font-medium text-gray-600">Rooms:</span>
          <span className="text-sm font-semibold text-primary-600">{roomCount}</span>
        </div>
        
        {floor.description && (
          <div className="pt-4 border-t border-gray-200 mt-auto">
            <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">{floor.description}</p>
          </div>
        )}
        
        {roomCount > 0 && (
          <div className="mt-4">
            <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 text-xs font-semibold rounded-xl border border-primary-200">
              Click to view rooms
            </span>
          </div>
        )}
      </div>
      
      {/* Action buttons at the bottom */}
      <div className="flex items-center justify-end space-x-2 mt-6 pt-4 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onEdit(floor)}
          className="p-2.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200"
          title="Edit floor"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(floor.id)}
          disabled={roomCount > 0}
          className="p-2.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded-xl transition-all duration-200"
          title="Delete floor"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Main FloorTable component
export function FloorTable({ 
  floors = [], 
  onEdit, 
  onDelete, 
  onClick,
  viewMode = 'table',
  searchTerm = '',
  onSearchChange,
  loading = false
}) {
  const columns = React.useMemo(
    () => createFloorColumns(onEdit, onDelete, onClick),
    [onEdit, onDelete, onClick]
  );

  return (
    <DataTable
      data={floors}
      columns={columns}
      searchPlaceholder="Search floors by name, number, or description..."
      emptyMessage="No floors found. Add floors to start organizing your PG structure."
      emptyIcon={Building}
      onRowClick={onClick}
      viewMode={viewMode}
      cardComponent={(props) => <FloorCard {...props} onEdit={onEdit} onDelete={onDelete} onClick={onClick} />}
      loading={loading}
    />
  );
}

export default FloorTable;
