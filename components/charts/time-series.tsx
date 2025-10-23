"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  TimeSeriesScale,
} from "chart.js";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  TimeSeriesScale
);

export function TimeSeries({
  labels,
  series,
  label,
  color = "#2563eb",
  height = 240,
}: {
  labels: string[];
  series: number[];
  label: string;
  color?: string;
  height?: number;
}) {
  return (
    <div style={{ height }}>
      <Line
        data={{
          labels,
          datasets: [
            {
              label,
              data: series,
              borderColor: color,
              backgroundColor: color,
              fill: false,
              tension: 0.25,
              pointRadius: 0,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { display: true, ticks: { maxTicksLimit: 6 } },
            y: { display: true },
          },
        }}
      />
    </div>
  );
}
