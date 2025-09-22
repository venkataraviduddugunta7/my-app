'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import apiService from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function AnalyticsPage() {
  const { selectedProperty } = useSelector((state) => state.property);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!selectedProperty?.id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await apiService.analytics.getDashboard(selectedProperty.id, '30d');
        setData(res.data || res);
      } catch (e) {
        setError(e.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedProperty]);

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">Key performance metrics for your property</p>
      </div>

      {!selectedProperty && (
        <Card>
          <CardContent className="p-8 text-center">Select a property to view analytics.</CardContent>
        </Card>
      )}

      {selectedProperty && loading && (
        <Card>
          <CardContent className="p-8 text-center">Loading analytics...</CardContent>
        </Card>
      )}

      {selectedProperty && error && (
        <Card>
          <CardContent className="p-8 text-center text-red-600">{error}</CardContent>
        </Card>
      )}

      {selectedProperty && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Occupancy Rate</CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-2xl font-semibold">{Math.round(data.kpis.occupancyRate)}%</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Avg. Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-2xl font-semibold">₹{Math.round(data.kpis.monthlyRevenue)}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Outstanding Amount</CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-2xl font-semibold">₹{Math.round(data.kpis.outstandingAmount)}</CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


