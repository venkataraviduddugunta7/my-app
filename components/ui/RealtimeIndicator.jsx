'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, 
  WifiOff, 
  Loader2, 
  Zap, 
  Shield, 
  Activity,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

export default function RealtimeIndicator() {
  // Mock WebSocket status for demonstration
  const [isConnected, setIsConnected] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState({
    reconnectAttempts: 0,
    subscriptions: ['property:123', 'dashboard:123', 'beds:123']
  });
  const [showDetails, setShowDetails] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  // Simulate connection changes for demo
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly simulate connection issues for demo
      if (Math.random() > 0.95) {
        setIsConnected(false);
        setConnectionStatus(prev => ({ ...prev, reconnectAttempts: 1 }));
        
        // Reconnect after 2 seconds
        setTimeout(() => {
          setIsConnected(true);
          setConnectionStatus(prev => ({ ...prev, reconnectAttempts: 0 }));
        }, 2000);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Trigger pulse animation on connection status change
  useEffect(() => {
    setPulseAnimation(true);
    const timer = setTimeout(() => setPulseAnimation(false), 1000);
    return () => clearTimeout(timer);
  }, [isConnected]);

  const getStatusConfig = () => {
    if (isConnected) {
      return {
        color: 'from-emerald-500 to-emerald-600',
        textColor: 'text-emerald-700',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        icon: Wifi,
        text: 'Real-time Active',
        description: 'All systems operational'
      };
    }
    
    if (connectionStatus.reconnectAttempts > 0) {
      return {
        color: 'from-warning-500 to-warning-600',
        textColor: 'text-warning-700',
        bgColor: 'bg-warning-50',
        borderColor: 'border-warning-200',
        icon: Loader2,
        text: 'Reconnecting...',
        description: 'Attempting to restore connection'
      };
    }
    
    return {
      color: 'from-error-500 to-error-600',
      textColor: 'text-error-700',
      bgColor: 'bg-error-50',
      borderColor: 'border-error-200',
      icon: WifiOff,
      text: 'Disconnected',
      description: 'Real-time updates unavailable'
    };
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <div className="relative">
      <motion.button
        // whileHover={{ scale: 1.05 }}
        // whileTap={{ scale: 0.95 }}
        onClick={() => setShowDetails(!showDetails)}
        className={`
          flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold 
          transition-all duration-300 border
          ${config.bgColor} ${config.textColor} ${config.borderColor}
          ${pulseAnimation ? 'animate-pulse-glow' : ''}
        `}
      >
        <div className="relative">
          <StatusIcon className={`w-4 h-4 ${
            connectionStatus.reconnectAttempts > 0 ? 'animate-spin' : ''
          }`} />
          
          {/* Connection pulse dot */}
          {isConnected && (
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full"
            />
          )}
        </div>
        
        <span className="hidden sm:inline">{config.text}</span>
        
        {/* Active indicator */}
        {isConnected && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 bg-emerald-500 rounded-full"
          />
        )}
      </motion.button>

      {/* Enhanced Details Dropdown */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-float-lg z-50 overflow-hidden"
          >
            {/* Header */}
            <div className={`p-4 bg-gradient-to-r ${config.color} text-white`}>
              <div className="flex items-center space-x-2">
                <StatusIcon className="h-5 w-5" />
                <div>
                  <h3 className="font-semibold">Connection Status</h3>
                  <p className="text-sm opacity-90">{config.description}</p>
                </div>
              </div>
            </div>

            {/* Status Details */}
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className={`w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className={`text-sm font-semibold ${config.textColor}`}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </p>
                </div>
                
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs text-gray-500">Subscriptions</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {connectionStatus.subscriptions.length}
                  </p>
                </div>
              </div>

              {connectionStatus.reconnectAttempts > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-warning-50 border border-warning-200 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-warning-600" />
                    <div>
                      <p className="text-sm font-medium text-warning-800">Reconnecting</p>
                      <p className="text-xs text-warning-600">
                        Attempt {connectionStatus.reconnectAttempts}/5
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Active Subscriptions */}
              {connectionStatus.subscriptions.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                    <Zap className="w-4 h-4 mr-1 text-primary-500" />
                    Active Subscriptions
                  </h4>
                  <div className="space-y-2">
                    {connectionStatus.subscriptions.map((sub, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="text-xs font-medium text-gray-700">
                            {sub.replace(':', ' • ')}
                          </span>
                        </div>
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Features List */}
              <div className="pt-3 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center space-x-1 text-gray-600">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    <span>Live Updates</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-600">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    <span>Instant Sync</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-600">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    <span>Push Notifications</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-600">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    <span>Auto Reconnect</span>
                  </div>
                </div>
              </div>

              {/* Performance Info */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Latency</span>
                  <span className="font-semibold text-emerald-600">~12ms</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                  <span>Protocol</span>
                  <span className="font-semibold">WebSocket</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}