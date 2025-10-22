'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Upload, Download } from 'lucide-react';
import { formatDuration, formatSpeed, getStateBadgeColor } from '@/lib/utils';
import type { Connection } from '@/types';

interface ConnectionTableProps {
  connections: Connection[];
}

type SortField = keyof Connection | 'transfer_rate' | null;
type SortDirection = 'asc' | 'desc';

// Memoized sort button to prevent re-renders
const SortButton = memo(({
  field,
  label,
  isActive,
  sortDirection,
  onClick
}: {
  field: SortField;
  label: string;
  isActive: boolean;
  sortDirection: SortDirection;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
        isActive
          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
      }`}
    >
      {label}
      {isActive && (
        sortDirection === 'asc'
          ? <ArrowUp className="w-3 h-3 ml-1" />
          : <ArrowDown className="w-3 h-3 ml-1" />
      )}
    </button>
  );
});

SortButton.displayName = 'SortButton';

export function ConnectionTable({ connections }: ConnectionTableProps) {
  const [sortField, setSortField] = useState<SortField>('transfer_rate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Switch to new field, default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField]);

  const sortedConnections = useMemo(() => {
    if (!sortField) return connections;

    return [...connections].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      // Special handling for transfer_rate (combined upload + download)
      if (sortField === 'transfer_rate') {
        aValue = a.upload_speed + a.download_speed;
        bValue = b.upload_speed + b.download_speed;
      } else {
        aValue = a[sortField as keyof Connection];
        bValue = b[sortField as keyof Connection];
      }

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [connections, sortField, sortDirection]);

  if (connections.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-12 text-center">
        <p className="text-gray-400 text-lg">No active connections</p>
        <p className="text-gray-500 text-sm mt-2">
          Connections will appear here when network activity is detected
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
      {/* Sort controls */}
      <div className="px-4 py-3 border-b border-gray-700 bg-gray-800/50">
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-medium text-gray-400 py-1.5">Sort by:</span>
          <SortButton
            field="transfer_rate"
            label="Transfer Rate"
            isActive={sortField === 'transfer_rate'}
            sortDirection={sortDirection}
            onClick={() => handleSort('transfer_rate')}
          />
          <SortButton
            field="process_name"
            label="Process"
            isActive={sortField === 'process_name'}
            sortDirection={sortDirection}
            onClick={() => handleSort('process_name')}
          />
          <SortButton
            field="remote_addr"
            label="Address"
            isActive={sortField === 'remote_addr'}
            sortDirection={sortDirection}
            onClick={() => handleSort('remote_addr')}
          />
          <SortButton
            field="state"
            label="State"
            isActive={sortField === 'state'}
            sortDirection={sortDirection}
            onClick={() => handleSort('state')}
          />
          <SortButton
            field="duration"
            label="Duration"
            isActive={sortField === 'duration'}
            sortDirection={sortDirection}
            onClick={() => handleSort('duration')}
          />
        </div>
      </div>

      {/* Connection cards */}
      <div className="divide-y divide-gray-700">
        {sortedConnections.map((connection) => (
          <div
            key={connection.id}
            className="p-4 hover:bg-gray-700/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left side - Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-white truncate">
                    {connection.process_name}
                  </h3>
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${getStateBadgeColor(
                      connection.state
                    )}`}
                  >
                    {connection.state}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <span className="text-gray-500">→</span>
                    <span className="font-mono truncate">{connection.remote_addr}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{connection.protocol}</span>
                    <span>•</span>
                    <span>PID: {connection.pid || 'N/A'}</span>
                    <span>•</span>
                    <span>{formatDuration(connection.duration)}</span>
                  </div>
                </div>
              </div>

              {/* Right side - Transfer rate */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <div className="text-lg font-bold text-white">
                  {formatSpeed(connection.upload_speed + connection.download_speed)}
                </div>
                <div className="flex gap-3 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Upload className="w-3 h-3 text-green-400" />
                    {formatSpeed(connection.upload_speed)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="w-3 h-3 text-blue-400" />
                    {formatSpeed(connection.download_speed)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="bg-gray-800/50 px-4 py-3 border-t border-gray-700">
        <p className="text-sm text-gray-400">
          {sortedConnections.length} {sortedConnections.length === 1 ? 'connection' : 'connections'}
        </p>
      </div>
    </div>
  );
}
