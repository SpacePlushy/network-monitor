'use client';

import { ArrowDown, ArrowUp, Activity, HardDrive } from 'lucide-react';
import { formatSpeed, formatBytes } from '@/lib/utils';
import type { Stats } from '@/types';

interface StatsCardsProps {
  stats: Stats;
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtitle?: string;
  color: 'green' | 'blue' | 'purple' | 'orange';
}

function StatCard({ title, value, icon, subtitle, color }: StatCardProps) {
  const colorClasses = {
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700 hover:border-gray-600 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full border-2 ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Upload Speed"
        value={formatSpeed(stats.total_upload_speed)}
        subtitle={`${formatBytes(stats.total_bytes_sent)} total`}
        icon={<ArrowUp className="w-6 h-6" />}
        color="green"
      />

      <StatCard
        title="Download Speed"
        value={formatSpeed(stats.total_download_speed)}
        subtitle={`${formatBytes(stats.total_bytes_received)} total`}
        icon={<ArrowDown className="w-6 h-6" />}
        color="blue"
      />

      <StatCard
        title="Active Connections"
        value={stats.active_connections.toString()}
        subtitle={stats.active_connections === 1 ? 'connection' : 'connections'}
        icon={<Activity className="w-6 h-6" />}
        color="purple"
      />

      <StatCard
        title="Combined Speed"
        value={formatSpeed(stats.total_upload_speed + stats.total_download_speed)}
        subtitle="Total bandwidth usage"
        icon={<HardDrive className="w-6 h-6" />}
        color="orange"
      />
    </div>
  );
}
