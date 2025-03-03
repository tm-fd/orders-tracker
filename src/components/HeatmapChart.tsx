// src/components/HeatmapChart.tsx
'use client';

import { ResponsiveContainer, ScatterChart, XAxis, YAxis, Scatter, ZAxis, Tooltip } from 'recharts';
import { Card, CardBody, CardHeader } from "@heroui/react";

interface HeatmapProps {
  data: Array<{
    x: number;
    y: number;
    value: number;
  }>;
  title?: string;
}

export default function HeatmapChart({ data, title = "Heatmap" }: HeatmapProps) {
  const CustomizedShape = (props: any) => {
    const { cx, cy, payload } = props;
    const cellSize = 30; // Size of each rectangle

    // Color scale function
    const getColor = (value: number) => {
      if (value < 20) return '#ffedea';
      if (value < 40) return '#ffcec5';
      if (value < 60) return '#ffad9f';
      if (value < 80) return '#ff8a75';
      return '#ff5533';
    };

    return (
      <rect
        x={cx - cellSize / 2}
        y={cy - cellSize / 2}
        width={cellSize}
        height={cellSize}
        fill={getColor(payload.value)}
        fillOpacity={0.8}
        stroke="#fff"
        strokeWidth={1}
      />
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <h3 className="text-xl font-bold">{title}</h3>
      </CardHeader>
      <CardBody>
        <div style={{ width: '100%', height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 40 }}
            >
              <XAxis
                type="number"
                dataKey="x"
                domain={[0, 23]}
                tickCount={24}
                name="Hour"
                label={{ value: 'Hour', position: 'bottom' }}
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={[0, 6]}
                tickCount={7}
                name="Day"
                tickFormatter={(value) => {
                  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  return days[value];
                }}
                label={{ value: 'Day', angle: -90, position: 'left' }}
              />
              <ZAxis type="number" dataKey="value" range={[0, 100]} />
              <Tooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    return (
                      <div className="bg-white p-2 rounded shadow">
                        <p>Hour: {data.x}:00</p>
                        <p>Day: {days[data.y]}</p>
                        <p>Value: {data.value}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter
                data={data}
                shape={<CustomizedShape />}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}