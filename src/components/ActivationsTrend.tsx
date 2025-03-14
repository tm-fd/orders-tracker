"use client";

import {
  Card,
  CardBody,
  CardHeader,
} from "@heroui/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import moment from "moment";

interface ActivationsTrendProps {
  purchaseStatuses: any;
}

export default function ActivationsTrend({ purchaseStatuses }: ActivationsTrendProps) {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (Object.keys(purchaseStatuses).length > 0) {
      calculateActivationTrends();
    }
  }, [purchaseStatuses]);

  const calculateActivationTrends = () => {
    // Prepare chart data based on activation records
    const activationsByDate = new Map();

    Object.values(purchaseStatuses).forEach((status) => {
      if (status?.activationRecords?.length > 0) {
        status.activationRecords.forEach((record) => {
          const date = moment(record.activation_date).format("YYYY-MM-DD");
          activationsByDate.set(date, (activationsByDate.get(date) || 0) + 1);
        });
      }
    });

    // Get last 14 days
    const last14Days = [...Array(14)]
      .map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split("T")[0];
      })
      .reverse();

    const newChartData = last14Days.map((date) => ({
      date,
      activations: activationsByDate.get(date) || 0,
    }));

    setChartData(newChartData);
  };

  return (
    <Card className="w-full h-[400px]">
      <CardHeader>
        <h3 className="text-xl font-bold">Activations Trend</h3>
      </CardHeader>
      <CardBody>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              textAnchor="end"
              height={60}
              interval={0}
              tick={{ fontSize: 12 }}
              domain={["dataMin", "dataMax"]}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="activations" fill="#0070F3" />
          </BarChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}