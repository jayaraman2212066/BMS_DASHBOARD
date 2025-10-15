import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { Telemetry } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface ChartProps {
  data: Telemetry[];
  title: string;
  metric: string;
  color?: string;
}

const Chart: React.FC<ChartProps> = ({ data, title, metric, color = '#3b82f6' }) => {
  const chartData = {
    labels: data.map(item => new Date(item.timestamp)),
    datasets: [
      {
        label: metric,
        data: data.map(item => item.metric_value),
        borderColor: color,
        backgroundColor: color + '20',
        tension: 0.1,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          displayFormats: {
            minute: 'HH:mm',
            hour: 'HH:mm',
            day: 'MMM dd',
          },
        },
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default Chart;