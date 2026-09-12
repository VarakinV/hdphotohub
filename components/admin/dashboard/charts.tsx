'use client';

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  type ChartOptions,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Filler
);

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === 'dark';
  return {
    dark,
    tick: dark ? '#a2a8c4' : '#5b6178',
    grid: dark ? 'rgba(255,255,255,0.07)' : 'rgba(19,29,59,0.06)',
    tooltipBg: '#131d3b',
  };
}

const baseOptions = (tick: string, grid: string, tooltipBg: string) =>
  ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' as const },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: tooltipBg,
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: tick, font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: grid },
        ticks: { color: tick, font: { size: 11 }, precision: 0 },
      },
    },
  }) satisfies ChartOptions<'bar'>;

export function OrdersBarChart({ series }: { series: number[] }) {
  const t = useChartTheme();
  const options = useMemo(() => baseOptions(t.tick, t.grid, t.tooltipBg), [t]);
  return (
    <div className="h-[230px]">
      <Bar
        options={options}
        data={{
          labels: MONTHS,
          datasets: [
            {
              data: series,
              backgroundColor: '#cb4154',
              hoverBackgroundColor: '#a8323f',
              borderRadius: 6,
              maxBarThickness: 26,
            },
          ],
        }}
      />
    </div>
  );
}

export function AovLineChart({ series }: { series: number[] }) {
  const t = useChartTheme();
  const options = useMemo(() => {
    const opts = baseOptions(t.tick, t.grid, t.tooltipBg) as ChartOptions<'line'>;
    if (opts.scales?.y?.ticks) {
      (opts.scales.y.ticks as any).callback = (v: any) => '$' + v;
    }
    return opts;
  }, [t]);
  return (
    <div className="h-[230px]">
      <Line
        options={options}
        data={{
          labels: MONTHS,
          datasets: [
            {
              data: series,
              borderColor: '#334577',
              backgroundColor: 'rgba(203,65,84,0.14)',
              fill: true,
              tension: 0.35,
              pointRadius: 0,
              pointHoverRadius: 5,
              pointBackgroundColor: '#cb4154',
              borderWidth: 2.4,
            },
          ],
        }}
      />
    </div>
  );
}
