'use client';

import { getCapacitySummary } from '@/utils/capacityValidation';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

export function CapacityIndicator({ property, showDetails = false }) {
  if (!property) return null;

  const capacitySummary = getCapacitySummary(property);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getProgressColor = (status) => {
    switch (status) {
      case 'critical':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  if (!showDetails) {
    // Compact view
    return (
      <div className="flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-1">
          {getStatusIcon(capacitySummary.floors.status)}
          <span className="font-medium">Floors: {capacitySummary.floors.current}/{capacitySummary.floors.total}</span>
        </div>
        <div className="flex items-center space-x-1">
          {getStatusIcon(capacitySummary.rooms.status)}
          <span className="font-medium">Rooms: {capacitySummary.rooms.current}/{capacitySummary.rooms.total}</span>
        </div>
        <div className="flex items-center space-x-1">
          {getStatusIcon(capacitySummary.beds.status)}
          <span className="font-medium">Beds: {capacitySummary.beds.current}/{capacitySummary.beds.total}</span>
        </div>
      </div>
    );
  }

  // Detailed view
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Capacity Overview</h3>
      
      {/* Floors */}
      <div className={`p-4 rounded-lg border ${getStatusColor(capacitySummary.floors.status)}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getStatusIcon(capacitySummary.floors.status)}
            <span className="font-medium">Floors</span>
          </div>
          <span className="text-sm font-semibold">
            {capacitySummary.floors.current}/{capacitySummary.floors.total}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${getProgressColor(capacitySummary.floors.status)}`}
            style={{ width: `${Math.min(capacitySummary.floors.percentage, 100)}%` }}
          />
        </div>
        <p className="text-xs mt-1">{capacitySummary.floors.percentage}% utilized</p>
      </div>

      {/* Rooms */}
      <div className={`p-4 rounded-lg border ${getStatusColor(capacitySummary.rooms.status)}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getStatusIcon(capacitySummary.rooms.status)}
            <span className="font-medium">Rooms</span>
          </div>
          <span className="text-sm font-semibold">
            {capacitySummary.rooms.current}/{capacitySummary.rooms.total}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${getProgressColor(capacitySummary.rooms.status)}`}
            style={{ width: `${Math.min(capacitySummary.rooms.percentage, 100)}%` }}
          />
        </div>
        <p className="text-xs mt-1">{capacitySummary.rooms.percentage}% utilized</p>
      </div>

      {/* Beds */}
      <div className={`p-4 rounded-lg border ${getStatusColor(capacitySummary.beds.status)}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getStatusIcon(capacitySummary.beds.status)}
            <span className="font-medium">Beds</span>
          </div>
          <span className="text-sm font-semibold">
            {capacitySummary.beds.current}/{capacitySummary.beds.total}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${getProgressColor(capacitySummary.beds.status)}`}
            style={{ width: `${Math.min(capacitySummary.beds.percentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span>{capacitySummary.beds.percentage}% utilized</span>
          <span>{capacitySummary.beds.occupied} occupied</span>
        </div>
      </div>

      {/* Capacity Warnings */}
      {Object.values(capacitySummary).some(item => item.status === 'critical') && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-red-800">Capacity Limit Reached</span>
          </div>
          <p className="text-xs text-red-600 mt-1">
            You've reached the maximum capacity for this property. Update property details to increase capacity.
          </p>
        </div>
      )}
    </div>
  );
}
