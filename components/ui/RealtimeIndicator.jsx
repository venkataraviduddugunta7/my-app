'use client';

import { LoaderCircle, Wifi, WifiOff } from 'lucide-react';
import { useWebSocket } from '@/components/providers/WebSocketProvider';

export default function RealtimeIndicator() {
  const { isConnected, connectionStatus } = useWebSocket();
  const isReconnecting = !isConnected && connectionStatus.reconnectAttempts > 0;

  const containerClassName = isConnected
    ? 'border-emerald-300/30 bg-emerald-500/15 text-emerald-100'
    : isReconnecting
      ? 'border-amber-300/30 bg-amber-500/15 text-amber-100'
      : 'border-white/15 bg-white/[0.08] text-slate-100';

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] ${containerClassName}`}
    >
      {isConnected ? (
        <Wifi className="h-4 w-4 text-emerald-200" />
      ) : isReconnecting ? (
        <LoaderCircle className="h-4 w-4 animate-spin text-amber-200" />
      ) : (
        <WifiOff className="h-4 w-4 text-slate-300" />
      )}
      <span className="hidden sm:inline">
        {isConnected ? 'Realtime Connected' : isReconnecting ? 'Realtime Reconnecting' : 'Realtime Offline'}
      </span>
    </div>
  );
}
