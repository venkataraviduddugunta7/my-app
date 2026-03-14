'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
  Bed,
  Clock
} from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Dropdown } from './Dropdown';
import { cn } from '@/lib/utils';

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
  tableClassName = "",
  headerCellClassName = "",
  cellClassName = "",
  firstColumnClassName = "min-w-[12.5rem]",
  loading = false,
  actions = null, // Custom actions component
  viewMode = 'table', // 'table' or 'cards'
  cardComponent = null, // Custom card component for card view
  ...props
}) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [paginationState, setPagination] = useState({
    pageIndex: 0,
    pageSize: pageSize,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const media = window.matchMedia('(max-width: 767px)');
    const sync = (event) => setIsMobile(event.matches);
    setIsMobile(media.matches);

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', sync);
      return () => media.removeEventListener('change', sync);
    }

    media.addListener(sync);
    return () => media.removeListener(sync);
  }, []);

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

  const resolvedViewMode = useMemo(() => {
    if (isMobile && cardComponent) {
      return 'cards';
    }

    return viewMode;
  }, [isMobile, cardComponent, viewMode]);

  // Card view
  if (resolvedViewMode === 'cards' && cardComponent) {
    const CardComponent = cardComponent;
  return (
    <div className={`space-y-6 ${className}`}>
        {/* Cards Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
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
          <div className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-200/80 bg-white/92 p-4 shadow-[0_14px_32px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="text-xs font-medium text-slate-500 sm:text-sm">
              Showing <span className="font-semibold text-slate-900">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span> to{' '}
              <span className="font-semibold text-slate-900">
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}
              </span>{' '}
              of <span className="font-semibold text-slate-900">{table.getFilteredRowModel().rows.length}</span> results
            </div>
            <div className="flex items-center justify-between gap-2 sm:justify-start sm:space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="rounded-xl border border-slate-200/80 bg-white text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center space-x-2 rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 sm:px-4">
                <span className="text-xs font-medium text-slate-600 sm:text-sm">
                  Page <span className="font-semibold text-slate-900">{table.getState().pagination.pageIndex + 1}</span> of{' '}
                  <span className="font-semibold text-slate-900">{table.getPageCount()}</span>
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="rounded-xl border border-slate-200/80 bg-white text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50"
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
      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.94))] shadow-[0_18px_40px_rgba(15,23,42,0.05)] backdrop-blur">
        {isMobile && !cardComponent && (
          <div className="border-b border-slate-200/80 bg-slate-50/90 px-4 py-2 text-xs font-medium text-slate-500">
            Swipe horizontally to view all columns
          </div>
        )}
        <div className="overflow-x-auto">
          <table className={cn("min-w-[760px] w-full text-sm", tableClassName)}>
            <thead className="bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.96))]">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const meta = header.column.columnDef.meta || {};

                    return (
                      <th
                        key={header.id}
                        className={cn(
                          "border-b border-slate-200/80 px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500",
                          headerCellClassName,
                          meta.headerClassName
                        )}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={`flex items-center space-x-2 group ${
                              header.column.getCanSort() ? 'cursor-pointer select-none hover:text-slate-900' : ''
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
                                    header.column.getIsSorted() === 'asc' ? 'text-slate-900' : 'text-slate-400'
                                  }`}
                                />
                                <ChevronDown
                                  className={`w-3 h-3 -mt-1 transition-colors duration-200 ${
                                    header.column.getIsSorted() === 'desc' ? 'text-slate-900' : 'text-slate-400'
                                  }`}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
              </thead>
            <tbody className="divide-y divide-slate-200/70">
              {table.getRowModel().rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={`group transition-all duration-200 ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${rowClassName} ${index % 2 === 0 ? 'bg-white/95' : 'bg-slate-50/35'} hover:bg-sky-50/45`}
                  onClick={() => onRowClick && onRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell, cellIndex) => {
                    const meta = cell.column.columnDef.meta || {};

                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          `whitespace-nowrap px-5 py-4 align-top ${cellIndex === 0 ? firstColumnClassName : ''}`,
                          cellClassName,
                          meta.cellClassName
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
                ))}
              </tbody>
            </table>
          </div>
      </div>

      {/* Empty State */}
      {table.getRowModel().rows.length === 0 && (
        <div className="text-center py-16">
          <div className="rounded-[1.75rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,0.94))] p-12 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            {EmptyIcon && (
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[1.35rem] border border-sky-200/80 bg-sky-100/80 shadow-[0_12px_24px_rgba(56,189,248,0.14)]">
                <EmptyIcon className="h-8 w-8 text-sky-700" />
              </div>
            )}
            <h3 className="mb-3 text-xl font-semibold text-slate-900">No data found</h3>
            <p className="mx-auto max-w-md text-slate-500">{emptyMessage}</p>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && table.getPageCount() > 1 && (
        <div className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-200/80 bg-white/92 p-4 shadow-[0_14px_32px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="text-xs font-medium text-slate-500 sm:text-sm">
            Showing <span className="font-semibold text-slate-900">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span> to{' '}
            <span className="font-semibold text-slate-900">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}
            </span>{' '}
            of <span className="font-semibold text-slate-900">{table.getFilteredRowModel().rows.length}</span> results
          </div>
          <div className="flex items-center justify-between gap-2 sm:justify-start sm:space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-xl border border-slate-200/80 bg-white text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-2 rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 sm:px-4">
              <span className="text-xs font-medium text-slate-600 sm:text-sm">
                Page <span className="font-semibold text-slate-900">{table.getState().pagination.pageIndex + 1}</span> of{' '}
                <span className="font-semibold text-slate-900">{table.getPageCount()}</span>
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-xl border border-slate-200/80 bg-white text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50"
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
      <span className="text-sm font-medium text-slate-900">{getValue() || '-'}</span>
    ),
    ...options,
  }),

  // Number column
  number: (accessorKey, header, options = {}) => ({
    accessorKey,
    header,
    cell: ({ getValue }) => (
      <span className="text-sm font-semibold text-slate-900">{getValue()?.toLocaleString() || '0'}</span>
    ),
    ...options,
  }),

  // Currency column
  currency: (accessorKey, header, options = {}) => ({
    accessorKey,
    header,
    cell: ({ getValue }) => (
      <span className="text-sm font-semibold text-slate-900">
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
        <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${config.color}`}>
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
        <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${config.color}`}>
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
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {actions
          .filter((action) => !action.condition || action.condition(row.original))
          .map((action, index) => {
          const IconComponent = action.icon;
          return (
            <Button
              key={index}
              variant={action.variant || 'outline'}
              size="icon"
              onClick={() => action.onClick(row.original)}
              disabled={action.disabled?.(row.original)}
              className={`rounded-xl border border-slate-200/80 bg-white text-slate-500 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 ${action.className || ''}`}
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
          <div className={`mr-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/70 ${config.bgColor} shadow-[0_10px_20px_rgba(15,23,42,0.05)]`}>
            <IconComponent className={`w-5 h-5 ${config.color}`} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">
              {row.original[header.toLowerCase().replace(/\s+/g, '')] || value}
            </div>
            <div className="text-xs text-slate-500">
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
          <div className="font-semibold text-slate-900">{date.toLocaleDateString()}</div>
          <div className="text-xs text-slate-500">{date.toLocaleTimeString()}</div>
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
          <span className="min-w-[3rem] text-right text-xs font-semibold text-slate-600">{Math.round(percentage)}%</span>
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
    AVAILABLE: {
      color: 'border-emerald-200/80 bg-emerald-50 text-emerald-700',
      icon: CheckCircle,
      label: 'Available'
    },
    OCCUPIED: {
      color: 'border-rose-200/80 bg-rose-50 text-rose-700',
      icon: User,
      label: 'Occupied'
    },
    MAINTENANCE: {
      color: 'border-amber-200/80 bg-amber-50 text-amber-700',
      icon: AlertCircle,
      label: 'Maintenance'
    },
    Available: {
      color: 'border-emerald-200/80 bg-emerald-50 text-emerald-700',
      icon: CheckCircle,
      label: 'Available'
    },
    Occupied: {
      color: 'border-rose-200/80 bg-rose-50 text-rose-700',
      icon: User,
      label: 'Occupied'
    },
    Maintenance: {
      color: 'border-amber-200/80 bg-amber-50 text-amber-700',
      icon: AlertCircle,
      label: 'Maintenance'
    }
  },

  // Room status
  roomStatus: {
    AVAILABLE: {
      color: 'border-emerald-200/80 bg-emerald-50 text-emerald-700',
      icon: CheckCircle,
      label: 'Available'
    },
    OCCUPIED: {
      color: 'border-rose-200/80 bg-rose-50 text-rose-700',
      icon: User,
      label: 'Occupied'
    },
    MAINTENANCE: {
      color: 'border-amber-200/80 bg-amber-50 text-amber-700',
      icon: AlertCircle,
      label: 'Maintenance'
    },
    available: {
      color: 'border-emerald-200/80 bg-emerald-50 text-emerald-700',
      icon: CheckCircle,
      label: 'Available'
    },
    occupied: {
      color: 'border-rose-200/80 bg-rose-50 text-rose-700',
      icon: User,
      label: 'Occupied'
    },
    maintenance: {
      color: 'border-amber-200/80 bg-amber-50 text-amber-700',
      icon: AlertCircle,
      label: 'Maintenance'
    }
  },

  // Floor status
  floorStatus: {
    active: {
      color: 'border-emerald-200/80 bg-emerald-50 text-emerald-700',
      icon: CheckCircle,
      label: 'Active'
    },
    inactive: {
      color: 'border-slate-200/80 bg-slate-50 text-slate-700',
      icon: AlertCircle,
      label: 'Inactive'
    }
  },

  // Tenant status
  tenantStatus: {
    ACTIVE: {
      color: 'border-emerald-200/80 bg-emerald-50 text-emerald-700',
      icon: CheckCircle,
      label: 'Active'
    },
    VACATED: {
      color: 'border-slate-200/80 bg-slate-50 text-slate-700',
      icon: AlertCircle,
      label: 'Vacated'
    },
    PENDING: {
      color: 'border-amber-200/80 bg-amber-50 text-amber-700',
      icon: Clock,
      label: 'Pending'
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
  },

  // Tenant icons
  tenantIcons: {
    default: {
      icon: User,
      color: 'text-primary-600',
      bgColor: 'bg-gradient-to-br from-primary-100 to-primary-200'
    }
  }
};

export default DataTable;
