'use client';

import { useState, useEffect } from 'react';
import { Network, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { StatsCards } from '@/components/StatsCards';
import { ConnectionTable } from '@/components/ConnectionTable';
import { BandwidthChart } from '@/components/BandwidthChart';
import type { Connection, Stats } from '@/types';

export default function Home() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_upload_speed: 0,
    total_download_speed: 0,
    active_connections: 0,
    total_bytes_sent: 0,
    total_bytes_received: 0,
    uptime: 0,
  });

  const { data, isConnected, error, reconnectAttempts } = useWebSocket();

  useEffect(() => {
    if (data) {
      setConnections(data.connections);
      setStats(data.stats);
    }
  }, [data]);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Network className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Network Monitor</h1>
                <p className="text-sm text-gray-400">Real-time connection and bandwidth tracking</p>
              </div>
            </div>

            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-medium text-green-400">Connected</span>
                </>
              ) : error ? (
                <>
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-sm font-medium text-red-400">
                    {reconnectAttempts > 0
                      ? `Reconnecting... (${reconnectAttempts})`
                      : 'Disconnected'}
                  </span>
                </>
              ) : (
                <>
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  <span className="text-sm font-medium text-blue-400">Connecting...</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <div>
                  <h3 className="text-sm font-medium text-red-300">Connection Error</h3>
                  <p className="text-sm text-red-400 mt-1">{error}</p>
                  <p className="text-xs text-red-500 mt-2">
                    Make sure the backend is running: <code className="bg-red-950/50 px-2 py-1 rounded text-red-300">python backend/main.py</code>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <StatsCards stats={stats} />

          {/* Bandwidth Chart */}
          <BandwidthChart
            realTimeData={{
              upload: stats.total_upload_speed,
              download: stats.total_download_speed,
            }}
          />

          {/* Connections Table */}
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-white">Active Connections</h2>
              <p className="text-sm text-gray-400 mt-1">
                Real-time list of all network connections
              </p>
            </div>
            <ConnectionTable connections={connections} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-400">
            Network Monitor - Built with Next.js and FastAPI
          </p>
        </div>
      </footer>
    </div>
  );
}
