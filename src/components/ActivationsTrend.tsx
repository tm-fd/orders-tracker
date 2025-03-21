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
import usePurchaseStore from "@/app/store/purchaseStore";

interface DateRange {
  start: {
    year: number;
    month: number;
    day: number;
  };
  end: {
    year: number;
    month: number;
    day: number;
  };
}

interface ActivationsTrendProps {
  dateRange: DateRange | null;
}

export default function ActivationsTrend({ dateRange }: ActivationsTrendProps) {
  const { purchaseStatuses } = usePurchaseStore();
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (Object.keys(purchaseStatuses).length > 0 && dateRange?.start && dateRange?.end) {
      calculateActivationTrends();
    }
  }, [purchaseStatuses, dateRange]);

  const calculateActivationTrends = () => {
    if (!dateRange) return;

    // Convert date range to moment dates
    const startDate = moment(new Date(
      dateRange.start.year,
      dateRange.start.month - 1,
      dateRange.start.day
    ));
    const endDate = moment(new Date(
      dateRange.end.year,
      dateRange.end.month - 1,
      dateRange.end.day
    ));

    // Prepare chart data based on activation records
    const activationsByDate = new Map();

    Object.values(purchaseStatuses).forEach((status) => {
      if (status?.activationRecords?.length > 0) {
        status.activationRecords.forEach((record) => {
          const activationDate = moment(record.activation_date);
          // Only include activations within the selected date range
          if (activationDate.isBetween(startDate, endDate, 'day', '[]')) {
            const date = activationDate.format("YYYY-MM-DD");
            activationsByDate.set(date, (activationsByDate.get(date) || 0) + 1);
          }
        });
      }
    });

    // Calculate total days in the selected range
    const daysInRange = endDate.diff(startDate, 'days') + 1;

    // Generate array of dates within the selected range
    const dates = [...Array(daysInRange)].map((_, i) => {
      return startDate.clone().add(i, 'days').format("YYYY-MM-DD");
    });

    const newChartData = dates.map((date) => ({
      date,
      activations: activationsByDate.get(date) || 0,
    }));

    setChartData(newChartData);
  };

  return (
    <Card className="w-full h-[400px] pt-4 px-4">
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
              interval={Math.max(Math.floor(chartData.length / 15), 0)}
              tick={{ fontSize: 12, angle: -45 }}
              domain={["dataMin", "dataMax"]}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="activations" fill="#0070F3" name="Activations" />
          </BarChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}