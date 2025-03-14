import { Card, CardHeader, CardBody } from "@heroui/react";
import {
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Area,
  ResponsiveContainer,
} from "recharts";
import { useState, useEffect } from "react";
import moment from "moment";

type PeriodUnit = "days" | "weeks" | "months";

interface Period {
  value: number;
  unit: PeriodUnit;
}

interface PurchaseStatus {
  purchaseId: number;
  purchaseDate: Date;
  orderStatus: any;
  shippingInfo: any;
  activationRecords: any[];
}

interface PurchaseTrendsProps {
  purchaseStatuses: Record<string, PurchaseStatus>;
}

export default function PurchaseTrends({ purchaseStatuses }: PurchaseTrendsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>({
    value: 30,
    unit: "days",
  });
  const [purchaseChartData, setPurchaseChartData] = useState([]);

  useEffect(() => {
    if (Object.keys(purchaseStatuses).length > 0) {
      calculatePurchaseData();
    }
  }, [purchaseStatuses, selectedPeriod]);

  const getMovingAverageWindow = () => {
    return selectedPeriod.value;
  };

  const calculatePurchaseData = () => {
    const purchasesByDate = new Map();

    // Group purchases by date
    Object.values(purchaseStatuses).forEach((status) => {
      const date = moment(status.purchaseDate).format("YYYY-MM-DD");
      purchasesByDate.set(date, (purchasesByDate.get(date) || 0) + 1);
    });

    // Calculate total days to show based on period
    const daysToShow =
      selectedPeriod.unit === "days"
        ? selectedPeriod.value
        : selectedPeriod.unit === "weeks"
        ? selectedPeriod.value * 7
        : selectedPeriod.value * 30;

    const dates = [...Array(daysToShow)].map((_, i) => {
      const date = moment().subtract(daysToShow - i - 1, "days");
      return date.format("YYYY-MM-DD");
    });

    // Use a sliding window for moving average
    const windowSize = Math.min(selectedPeriod.value, daysToShow);

    const data = dates.map((date, index) => {
      const purchases = purchasesByDate.get(date) || 0;

      // Calculate moving average starting from the first day
      let movingAvg = 0;
      const startIdx = Math.max(0, index - windowSize + 1);
      const currentWindow = dates.slice(startIdx, index + 1);
      
      const sum = currentWindow.reduce(
        (acc, d) => acc + (purchasesByDate.get(d) || 0),
        0
      );
      movingAvg = sum / currentWindow.length;

      return {
        date,
        purchases,
        movingAverage: Number(movingAvg.toFixed(2)),
      };
    });

    setPurchaseChartData(data);
  };

  return (
    <Card className="w-full h-[400px] mt-6">
      <CardHeader className="flex flex-row justify-between items-center">
        <h3 className="text-xl font-bold">Purchase Trends</h3>
        <div className="flex gap-2 items-center">
          <input
            name="averageWindow"
            type="number"
            min={2}
            max={
              selectedPeriod.unit === "days"
                ? 90
                : selectedPeriod.unit === "weeks"
                ? 52
                : 12
            }
            value={selectedPeriod.value}
            onChange={(e) => {
              const value = Math.max(1, parseInt(e.target.value) || 1);
              setSelectedPeriod((prev) => ({
                ...prev,
                value: value,
              }));
            }}
            className="bg-default-100 rounded-md p-2 w-20"
          />
          <select
            className="bg-default-100 rounded-md p-2"
            value={selectedPeriod.unit}
            onChange={(e) =>
              setSelectedPeriod((prev) => ({
                value: prev.value,
                unit: e.target.value as PeriodUnit,
              }))
            }
          >
            <option value="days">Days</option>
            <option value="weeks">Weeks</option>
            <option value="months">Months</option>
          </select>
        </div>
      </CardHeader>
      <CardBody>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={purchaseChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              textAnchor="end"
              height={60}
              interval={Math.max(Math.floor(purchaseChartData.length / 15), 0)}
              tick={{ fontSize: 12, angle: -45 }}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="purchases"
              fill="#8884d8"
              name={`${
                selectedPeriod.unit.charAt(0).toUpperCase() +
                selectedPeriod.unit.slice(1)
              } Purchases`}
            />
            <Area
              type="monotone"
              dataKey="movingAverage"
              stroke="#82ca9d"
              fill="#82ca9d"
              fillOpacity={0.3}
              name={`${getMovingAverageWindow()}-${selectedPeriod.unit.slice(
                0,
                -1
              )} moving average`}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}