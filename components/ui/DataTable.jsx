'use client';

import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  Search, 
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  User,
  CheckCircle,
  AlertCircle,
  Building,
  Home,
  Bed
} from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Dropdown } from './Dropdown';

// Reusable DataTable component
export function DataTable({
  data = [],
  columns = [],
  filterable = true,
  pagination = true,
  pageSize = 10,
  emptyMessage = "No data found",
  emptyIcon: EmptyIcon = null,
  onRowClick = null,
  className = "",
  headerClassName = "",
  rowClassName = "",
  loading = false,
  actions = null, // Custom actions component
  viewMode = 'table', // 'table' or 'cards'
  cardComponent = null, // Custom card component for card view
  ...props
}) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [paginationState, setPagination] = useState({
    pageIndex: 0,
    pageSize: pageSize,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination: paginationState,
    },
    enableRowSelection: false,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    debugTable: false,
  });

  // Card view
  if (viewMode === 'cards' && cardComponent) {
    const CardComponent = cardComponent;
  return (
    <div className={`space-y-6 ${className}`}>
        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {table.getRowModel().rows.map((row, index) => (
            <div
              key={row.id}
              className="transform transition-all duration-200 hover:scale-[1.02] hover:-translate-y-1"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <CardComponent data={row.original} />
          </div>
          ))}
        </div>

        {/* Empty State */}
        {table.getRowModel().rows.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-12 border border-gray-200 shadow-elegant">
              {EmptyIcon && (
                <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-elegant">
                  <EmptyIcon className="w-8 h-8 text-primary-600" />
                </div>
              )}
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No data found</h3>
              <p className="text-gray-600 max-w-md mx-auto">{emptyMessage}</p>
      </div>
          </div>
        )}

        {/* Pagination */}
        {pagination && table.getPageCount() > 1 && (
          <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 shadow-elegant p-6">
            <div className="text-sm text-gray-600 font-medium">
              Showing <span className="text-primary-600 font-semibold">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span> to{' '}
              <span className="text-primary-600 font-semibold">
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}
              </span>{' '}
              of <span className="text-primary-600 font-semibold">{table.getFilteredRowModel().rows.length}</span> results
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center space-x-2 bg-gray-50 rounded-xl px-4 py-2">
                <span className="text-sm font-medium text-gray-700">
                  Page <span className="text-primary-600 font-semibold">{table.getState().pagination.pageIndex + 1}</span> of{' '}
                  <span className="text-primary-600 font-semibold">{table.getPageCount()}</span>
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Table view
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-elegant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200/50"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={`flex items-center space-x-2 group ${
                            header.column.getCanSort() ? 'cursor-pointer select-none hover:text-primary-600' : ''
                          } transition-colors duration-200`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <span className="font-medium">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          {header.column.getCanSort() && (
                            <div className="flex flex-col opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                              <ChevronUp 
                                className={`w-3 h-3 transition-colors duration-200 ${
                                  header.column.getIsSorted() === 'asc' ? 'text-primary-600' : 'text-gray-400'
                                }`} 
                              />
                              <ChevronDown 
                                className={`w-3 h-3 -mt-1 transition-colors duration-200 ${
                                  header.column.getIsSorted() === 'desc' ? 'text-primary-600' : 'text-gray-400'
                                }`} 
                              />
                            </div>
                        )}
                      </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
              </thead>
            <tbody className="divide-y divide-gray-100">
              {table.getRowModel().rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={`group hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent transition-all duration-300 ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${rowClassName} ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                  onClick={() => onRowClick && onRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-5 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
                ))}
              </tbody>
            </table>
          </div>
      </div>

      {/* Empty State */}
      {table.getRowModel().rows.length === 0 && (
        <div className="text-center py-16">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-12 border border-gray-200 shadow-elegant">
            {EmptyIcon && (
              <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-elegant">
                <EmptyIcon className="w-8 h-8 text-primary-600" />
              </div>
            )}
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No data found</h3>
            <p className="text-gray-600 max-w-md mx-auto">{emptyMessage}</p>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && table.getPageCount() > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 shadow-elegant p-6">
          <div className="text-sm text-gray-600 font-medium">
            Showing <span className="text-primary-600 font-semibold">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span> to{' '}
            <span className="text-primary-600 font-semibold">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}
            </span>{' '}
            of <span className="text-primary-600 font-semibold">{table.getFilteredRowModel().rows.length}</span> results
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-2 bg-gray-50 rounded-xl px-4 py-2">
              <span className="text-sm font-medium text-gray-700">
                Page <span className="text-primary-600 font-semibold">{table.getState().pagination.pageIndex + 1}</span> of{' '}
                <span className="text-primary-600 font-semibold">{table.getPageCount()}</span>
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Column helper for type safety - re-export from TanStack Table
export { createColumnHelper };

// Common column types
export const columnTypes = {
  // Text column
  text: (accessorKey, header, options = {}) => ({
    accessorKey,
    header,
    cell: ({ getValue }) => (
      <span className="text-sm font-medium text-gray-900">{getValue() || '-'}</span>
    ),
    ...options,
  }),

  // Number column
  number: (accessorKey, header, options = {}) => ({
    accessorKey,
    header,
    cell: ({ getValue }) => (
      <span className="text-sm font-semibold text-gray-900">{getValue()?.toLocaleString() || '0'}</span>
    ),
    ...options,
  }),

  // Currency column
  currency: (accessorKey, header, options = {}) => ({
    accessorKey,
    header,
    cell: ({ getValue }) => (
      <span className="text-sm font-semibold text-primary-600">
        ₹{getValue()?.toLocaleString() || '0'}
      </span>
    ),
    ...options,
  }),

  // Status column with colored badges
  status: (accessorKey, header, statusConfig = {}, options = {}) => ({
    accessorKey,
    header,
    cell: ({ getValue }) => {
      const value = getValue();
      const config = statusConfig[value] || {
        color: 'bg-gray-100 text-gray-700 border border-gray-200',
        icon: AlertCircle,
        label: value
      };
      const IconComponent = config.icon;
      
      return (
        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${config.color}`}>
          <IconComponent className="w-3 h-3 mr-1.5" />
          {config.label}
        </span>
      );
    },
    ...options,
  }),

  // Badge column
  badge: (accessorKey, header, badgeConfig = {}, options = {}) => ({
    accessorKey,
    header,
    cell: ({ getValue }) => {
      const value = getValue();
      const config = badgeConfig[value] || {
        color: 'bg-gray-100 text-gray-700 border border-gray-200',
        label: value
      };
      
      return (
        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${config.color}`}>
          {config.label}
        </span>
      );
    },
    ...options,
  }),

  // Actions column
  actions: (actions = [], options = {}) => ({
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
        {actions.map((action, index) => {
          const IconComponent = action.icon;
                  return (
            <Button
              key={index}
              variant={action.variant || 'outline'}
              size="sm"
              onClick={() => action.onClick(row.original)}
              disabled={action.disabled?.(row.original)}
              className={`rounded-xl border-2 transition-all duration-200 ${action.className || ''}`}
              title={action.title}
            >
              <IconComponent className="w-4 h-4" />
            </Button>
                  );
                })}
              </div>
    ),
    ...options,
  }),

  // Icon column
  icon: (accessorKey, header, iconConfig = {}, options = {}) => ({
    accessorKey,
    header,
    cell: ({ getValue, row }) => {
      const value = getValue();
      const config = iconConfig[value] || iconConfig.default || {
        icon: AlertCircle,
        color: 'text-gray-500',
        bgColor: 'bg-gradient-to-br from-gray-100 to-gray-200'
      };
      const IconComponent = config.icon;
      
      return (
        <div className="flex items-center">
          <div className={`w-10 h-10 ${config.bgColor} rounded-xl flex items-center justify-center mr-4 shadow-elegant`}>
            <IconComponent className={`w-5 h-5 ${config.color}`} />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">
              {row.original[header.toLowerCase().replace(/\s+/g, '')] || value}
            </div>
            <div className="text-xs text-gray-500">
              {row.original.description || 'No description'}
            </div>
          </div>
        </div>
      );
    },
    ...options,
  }),

  // Date column
  date: (accessorKey, header, options = {}) => ({
    accessorKey,
    header,
    cell: ({ getValue }) => {
      const value = getValue();
      if (!value) return <span className="text-sm text-gray-400">-</span>;
      
      const date = new Date(value);
      return (
        <div className="text-sm">
          <div className="font-semibold text-gray-900">{date.toLocaleDateString()}</div>
          <div className="text-xs text-gray-500">{date.toLocaleTimeString()}</div>
        </div>
      );
    },
    ...options,
  }),

  // Progress column
  progress: (accessorKey, header, options = {}) => ({
    accessorKey,
    header,
    cell: ({ getValue }) => {
      const value = getValue();
      const percentage = Math.min(Math.max(value || 0, 0), 100);
      
      return (
        <div className="flex items-center space-x-3">
          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                percentage >= 100 ? 'bg-gradient-to-r from-error-500 to-error-600' :
                percentage >= 80 ? 'bg-gradient-to-r from-warning-500 to-warning-600' : 
                'bg-gradient-to-r from-success-500 to-success-600'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-600 min-w-[3rem] text-right">{Math.round(percentage)}%</span>
        </div>
      );
    },
    ...options,
  }),
};

// Common status configurations
export const statusConfigs = {
  // Bed status
  bedStatus: {
    Available: {
      color: 'bg-gradient-to-r from-success-50 to-success-100 text-success-700 border border-success-200',
      icon: CheckCircle,
      label: 'Available'
    },
    Occupied: {
      color: 'bg-gradient-to-r from-error-50 to-error-100 text-error-700 border border-error-200',
      icon: User,
      label: 'Occupied'
    },
    Maintenance: {
      color: 'bg-gradient-to-r from-warning-50 to-warning-100 text-warning-700 border border-warning-200',
      icon: AlertCircle,
      label: 'Maintenance'
    }
  },

  // Room status
  roomStatus: {
    available: {
      color: 'bg-gradient-to-r from-success-50 to-success-100 text-success-700 border border-success-200',
      icon: CheckCircle,
      label: 'Available'
    },
    occupied: {
      color: 'bg-gradient-to-r from-error-50 to-error-100 text-error-700 border border-error-200',
      icon: User,
      label: 'Occupied'
    },
    maintenance: {
      color: 'bg-gradient-to-r from-warning-50 to-warning-100 text-warning-700 border border-warning-200',
      icon: AlertCircle,
      label: 'Maintenance'
    }
  },

  // Floor status
  floorStatus: {
    active: {
      color: 'bg-gradient-to-r from-success-50 to-success-100 text-success-700 border border-success-200',
      icon: CheckCircle,
      label: 'Active'
    },
    inactive: {
      color: 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border border-gray-200',
      icon: AlertCircle,
      label: 'Inactive'
    }
  }
};

// Icon configurations
export const iconConfigs = {
  // Floor icons
  floorIcons: {
    default: {
      icon: Building,
      color: 'text-primary-600',
      bgColor: 'bg-gradient-to-br from-primary-100 to-primary-200'
    }
  },

  // Room icons
  roomIcons: {
    default: {
      icon: Home,
      color: 'text-secondary-600',
      bgColor: 'bg-gradient-to-br from-secondary-100 to-secondary-200'
    }
  },

  // Bed icons
  bedIcons: {
    default: {
      icon: Bed,
      color: 'text-accent-600',
      bgColor: 'bg-gradient-to-br from-accent-100 to-accent-200'
    }
  }
};

export default DataTable;