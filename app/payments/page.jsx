'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { CreditCard, RefreshCw } from 'lucide-react';

export default function PaymentsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // API integration pending for payments module.
    setLoading(false);
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-600">No static data is loaded. Connect payments API to start using this module.</p>
        </div>
        <Button variant="outline" onClick={() => setLoading(true) || setTimeout(() => setLoading(false), 300)}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-600">Loading...</p>
          ) : (
            <p className="text-sm text-gray-600">No payments found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
