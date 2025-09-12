'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Filter,
  Download,
  RefreshCw,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  SlidersHorizontal,
  Grid3X3,
  List,
  Columns,
  Star,
  Zap,
  TrendingUp,
  Users
} from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Card } from './Card';

export default function DataTable({
  data = [],
  columns = [],
  loading = false,
  searchable = true,
  filterable = true,
  sortable = true,
  exportable = true,
  refreshable = false,
  onRefresh,
  onRowClick,
  onRowSelect,
  selectedRows = [],
  pageSize = 10,
  className = '',
  emptyMessage = 'No data available',
  loadingMessage = 'Loading amazing data...',
  title,
  description,
  premium = true
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table', 'grid', 'list'

  // Get filterable columns
  const filterableColumns = useMemo(() => 
    columns.filter(col => col.filterable), [columns]
  );

  // Filter and search data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchTerm && searchable) {
      result = result.filter(item =>
        columns.some(col => {
          const value = col.accessor ? item[col.accessor] : '';
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        result = result.filter(item => {
          const itemValue = item[key];
          if (Array.isArray(value)) {
            return value.includes(itemValue);
          }
          return String(itemValue).toLowerCase().includes(String(value).toLowerCase());
        });
      }
    });

    return result;
  }, [data, searchTerm, filters, columns, searchable]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortable) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig, sortable]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Handle sorting
  const handleSort = (key) => {
    if (!sortable) return;
    
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page
  };

  // Export data as CSV
  const exportToCSV = () => {
    if (!exportable) return;

    const csvHeaders = columns.map(col => col.header).join(',');
    const csvRows = sortedData.map(item =>
      columns.map(col => {
        const value = col.accessor ? item[col.accessor] : '';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    );

    const csvContent = [csvHeaders, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title || 'data'}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const SortIcon = ({ column }) => {
    if (!sortable || !sortConfig.key || sortConfig.key !== column) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-primary-600" />
      : <ChevronDown className="w-4 h-4 text-primary-600" />;
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center space-x-4 p-4"
        >
          <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
        </motion.div>
      ))}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border border-gray-200 shadow-elegant overflow-hidden ${className}`}
    >
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && (
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xl font-bold text-gray-900 flex items-center"
              >
                <Grid3X3 className="w-5 h-5 mr-2 text-primary-600" />
                {title}
              </motion.h2>
            )}
            {description && (
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-sm text-gray-600 mt-1"
              >
                {description}
              </motion.p>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            {['table', 'grid', 'list'].map((mode) => {
              const Icon = mode === 'table' ? Grid3X3 : mode === 'grid' ? Columns : List;
              return (
                <motion.button
                  key={mode}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode(mode)}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === mode 
                      ? 'bg-white text-primary-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            {searchable && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  placeholder="Search data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-64 border border-gray-200 rounded-xl bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                />
                {searchTerm && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {filterable && filterableColumns.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filters</span>
                  {Object.values(filters).some(v => v && v !== 'all') && (
                    <span className="bg-primary-100 text-primary-800 text-xs px-2 py-0.5 rounded-full font-medium">
                      {Object.values(filters).filter(v => v && v !== 'all').length}
                    </span>
                  )}
                </Button>
              </motion.div>
            )}

            {/* Results Counter */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center space-x-2 text-sm text-gray-600"
            >
              <Users className="w-4 h-4" />
              <span>
                <span className="font-semibold text-gray-900">{sortedData.length}</span> results
                {searchTerm && ` for "${searchTerm}"`}
              </span>
            </motion.div>
          </div>

          <div className="flex items-center space-x-2">
            {refreshable && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  variant="outline"
                  onClick={onRefresh}
                  disabled={loading}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </Button>
              </motion.div>
            )}

            {exportable && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  variant="outline"
                  onClick={exportToCSV}
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Enhanced Filters Row */}
        <AnimatePresence>
          {showFilters && filterable && filterableColumns.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200"
            >
              {filterableColumns.map((column, index) => (
                <motion.div
                  key={column.accessor}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {column.header}
                  </label>
                  {column.filterOptions ? (
                    <select
                      value={filters[column.accessor] || 'all'}
                      onChange={(e) => handleFilterChange(column.accessor, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                    >
                      <option value="all">All</option>
                      {column.filterOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      placeholder={`Filter by ${column.header.toLowerCase()}`}
                      value={filters[column.accessor] || ''}
                      onChange={(e) => handleFilterChange(column.accessor, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
                    />
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table Content */}
      <div className="relative">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton />
          </div>
        ) : sortedData.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-12 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 mx-auto mb-4">
              <Grid3X3 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Found</h3>
            <p className="text-gray-600 max-w-sm mx-auto">
              {searchTerm || Object.values(filters).some(v => v && v !== 'all') 
                ? 'Try adjusting your search terms or filters to find what you\'re looking for.' 
                : emptyMessage
              }
            </p>
            {(searchTerm || Object.values(filters).some(v => v && v !== 'all')) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilters({});
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Enhanced Table Header */}
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  {onRowSelect && (
                    <th className="px-6 py-4 text-left w-12">
                      <motion.input
                        whileHover={{ scale: 1.1 }}
                        type="checkbox"
                        checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onRowSelect(paginatedData.map(item => item.id));
                          } else {
                            onRowSelect([]);
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 transition-all duration-200"
                      />
                    </th>
                  )}
                  
                  {columns.map((column, index) => (
                    <motion.th
                      key={column.accessor || column.header}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider group ${
                        sortable && column.sortable !== false ? 'cursor-pointer hover:bg-gray-200/50' : ''
                      }`}
                      onClick={() => column.sortable !== false && handleSort(column.accessor)}
                    >
                      <div className="flex items-center space-x-2">
                        <span>{column.header}</span>
                        {sortable && column.sortable !== false && (
                          <SortIcon column={column.accessor} />
                        )}
                      </div>
                    </motion.th>
                  ))}

                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
                    Actions
                  </th>
                </tr>
              </thead>

              {/* Enhanced Table Body */}
              <tbody className="bg-white divide-y divide-gray-100">
                {paginatedData.map((item, index) => (
                  <motion.tr
                    key={item.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ backgroundColor: '#f9fafb', scale: 1.005 }}
                    className={`group transition-all duration-200 ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick && onRowClick(item)}
                  >
                    {onRowSelect && (
                      <td className="px-6 py-4">
                        <motion.input
                          whileHover={{ scale: 1.1 }}
                          type="checkbox"
                          checked={selectedRows.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              onRowSelect([...selectedRows, item.id]);
                            } else {
                              onRowSelect(selectedRows.filter(id => id !== item.id));
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 transition-all duration-200"
                        />
                      </td>
                    )}

                    {columns.map((column) => (
                      <td key={column.accessor || column.header} className="px-6 py-4 whitespace-nowrap">
                        {column.render ? column.render(item, index) : (
                          <div className="flex items-center space-x-2">
                            {column.icon && <column.icon className="w-4 h-4 text-gray-400" />}
                            <span className="text-sm text-gray-900 font-medium">
                              {column.accessor ? item[column.accessor] : ''}
                            </span>
                          </div>
                        )}
                      </td>
                    ))}

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle view action
                          }}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle edit action
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle delete action
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Premium Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-700">
              <span className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-primary-500" />
                <span>
                  Showing <span className="font-semibold">{Math.min((currentPage - 1) * pageSize + 1, sortedData.length)}</span> to{' '}
                  <span className="font-semibold">{Math.min(currentPage * pageSize, sortedData.length)}</span> of{' '}
                  <span className="font-semibold">{sortedData.length}</span> results
                </span>
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </motion.button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let page;
                  if (totalPages <= 7) {
                    page = i + 1;
                  } else {
                    if (currentPage <= 4) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      page = totalPages - 6 + i;
                    } else {
                      page = currentPage - 3 + i;
                    }
                  }

                  return (
                    <motion.button
                      key={page}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 flex items-center justify-center text-sm font-medium rounded-lg transition-all duration-200 ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-glow-sm'
                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                      }`}
                    >
                      {page}
                    </motion.button>
                  );
                })}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Performance Indicator */}
      {premium && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute top-4 right-4 flex items-center space-x-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-2 py-1 rounded-full text-xs font-medium"
        >
          <Zap className="w-3 h-3" />
          <span>Live Data</span>
        </motion.div>
      )}
    </motion.div>
  );
}