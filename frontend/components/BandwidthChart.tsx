'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface BandwidthChartProps {
  realTimeData?: { upload: number; download: number };
}

// Format bytes per second to readable format
const formatBandwidth = (value: number): string => {
  if (value === 0) return '0 B/s';
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const k = 1024;
  const i = Math.floor(Math.log(value) / Math.log(k));
  return `${(value / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
};

const MAX_DATA_POINTS = 300; // 30 seconds at 0.1s intervals

const createInitialOption = (): EChartsOption => {
  // Initialize with 300 empty data points to prevent "piling up" at the start
  const now = new Date();
  const initialTimeData: string[] = [];
  const initialData: number[] = [];

  for (let i = MAX_DATA_POINTS - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 100); // 100ms intervals going backwards
    const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}.${Math.floor(time.getMilliseconds() / 100)}`;
    initialTimeData.push(timeStr);
    initialData.push(0);
  }

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(31, 41, 55, 0.95)',
      borderColor: '#374151',
      textStyle: {
        color: '#ffffff',
        fontSize: 12,
      },
      formatter: (params: any) => {
        if (!Array.isArray(params)) return '';
        const time = params[0].axisValue;
        let result = `<div style="font-weight: bold; margin-bottom: 4px;">${time}</div>`;
        params.forEach((param: any) => {
          const color = param.color;
          const name = param.seriesName;
          const value = formatBandwidth(param.value);
          result += `<div style="display: flex; align-items: center; gap: 8px;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${color};"></span>
            <span>${name}: <strong>${value}</strong></span>
          </div>`;
        });
        return result;
      },
    },
    legend: {
      data: ['Download', 'Upload'],
      top: 0,
      textStyle: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: 600,
      },
      itemWidth: 25,
      itemHeight: 14,
    },
    grid: {
      left: '80px',
      right: '40px',
      top: '50px',
      bottom: '50px',
      containLabel: false,
    },
    xAxis: {
      type: 'category',
      data: initialTimeData,
      boundaryGap: false,
      axisLine: {
        lineStyle: {
          color: '#4B5563',
        },
      },
      axisLabel: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
        interval: Math.floor(MAX_DATA_POINTS / 6),
        rotate: 0,
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#374151',
          type: 'dashed',
        },
      },
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: true,
        lineStyle: {
          color: '#4B5563',
        },
      },
      axisLabel: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
        formatter: (value: number) => formatBandwidth(value),
      },
      splitLine: {
        lineStyle: {
          color: '#374151',
          type: 'dashed',
        },
      },
    },
    series: [
      {
        name: 'Download',
        type: 'line',
        data: [...initialData],
        smooth: true,
        symbol: 'none',
        lineStyle: {
          color: '#3B82F6',
          width: 2,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
            ],
          },
        },
        emphasis: {
          focus: 'series',
        },
      },
      {
        name: 'Upload',
        type: 'line',
        data: [...initialData],
        smooth: true,
        symbol: 'none',
        lineStyle: {
          color: '#10B981',
          width: 2,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.05)' },
            ],
          },
        },
        emphasis: {
          focus: 'series',
        },
      },
    ],
    animation: true,
    animationDuration: 100,
    animationEasing: 'linear',
  };
};

export const BandwidthChart = memo(function BandwidthChart({ realTimeData }: BandwidthChartProps) {
  // Memoize initial options to avoid recreating on every render
  const initialOption = useMemo(() => createInitialOption(), []);
  const [option, setOption] = useState<EChartsOption>(initialOption);

  useEffect(() => {
    if (!realTimeData) return;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${Math.floor(now.getMilliseconds() / 100)}`;

    setOption((prevOption: any) => {
      // Optimized shallow cloning with structural sharing instead of deep clone
      const prevXAxisData = prevOption.xAxis.data;
      const prevDownloadData = prevOption.series[0].data;
      const prevUploadData = prevOption.series[1].data;

      // Create new arrays with updated data
      const newXAxisData = [...prevXAxisData, timeStr];
      const newDownloadData = [...prevDownloadData, realTimeData.download];
      const newUploadData = [...prevUploadData, realTimeData.upload];

      // Remove old data points if we exceed the max (sliding window)
      if (newXAxisData.length > MAX_DATA_POINTS) {
        newXAxisData.shift();
        newDownloadData.shift();
        newUploadData.shift();
      }

      // Return new option with structural sharing
      return {
        ...prevOption,
        xAxis: {
          ...prevOption.xAxis,
          data: newXAxisData
        },
        series: [
          {
            ...prevOption.series[0],
            data: newDownloadData
          },
          {
            ...prevOption.series[1],
            data: newUploadData
          }
        ]
      };
    });
  }, [realTimeData]);

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Bandwidth Over Time</h3>
        <p className="text-sm text-gray-400">Last 30 seconds</p>
      </div>
      <div className="w-full h-[350px]">
        <ReactECharts
          option={option}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
          notMerge={false}
          lazyUpdate={true}
        />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if data actually changed
  return prevProps.realTimeData?.upload === nextProps.realTimeData?.upload &&
         prevProps.realTimeData?.download === nextProps.realTimeData?.download;
});
