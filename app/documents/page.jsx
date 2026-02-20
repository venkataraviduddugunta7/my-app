'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { FileText, RefreshCw } from 'lucide-react';

export default function DocumentsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // API integration pending for documents module.
    setLoading(false);
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Documents</h1>
          <p className="text-sm text-gray-600">No static data is loaded. Connect documents API to start using this module.</p>
        </div>
        <Button variant="outline" onClick={() => setLoading(true) || setTimeout(() => setLoading(false), 300)}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Library
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-600">Loading...</p>
          ) : (
            <p className="text-sm text-gray-600">No documents found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
