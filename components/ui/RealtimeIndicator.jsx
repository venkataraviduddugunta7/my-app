'use client';

import { WifiOff } from 'lucide-react';

export default function RealtimeIndicator() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border bg-gray-50 text-gray-700 border-gray-200">
      <WifiOff className="w-4 h-4" />
      <span className="hidden sm:inline">Realtime Not Configured</span>
    </div>
  );
}
