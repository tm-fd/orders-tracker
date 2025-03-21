import { useState, useEffect, useCallback, use } from "react";
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
  Cell,
  ResponsiveContainer,
} from "recharts";
import moment from "moment";
import usePurchaseStore from "@/app/store/purchaseStore";

type PeriodUnit = "days" | "weeks" | "months";
type DataPointUnit = "daily" | "weekly" | "monthly";

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

interface PurchaseTrendsProps {
  dateRange: DateRange | null;
}

interface ChartDataPoint {
  date: string;
  purchases: number;
  movingAverage: number;
}

export default function PurchaseTrends({ dateRange }: PurchaseTrendsProps) {
  const { purchaseStatuses } = usePurchaseStore();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>({
    value: 30,
    unit: "days",
  });
  const [purchaseChartData, setPurchaseChartData] = useState<ChartDataPoint[]>(
    []
  );
  const [dataPointUnit, setDataPointUnit] = useState<DataPointUnit>("daily");

  useEffect(() => {
    console.log(
      "Purchase Chart Data:",
      purchaseChartData.map((d) => ({
        date: d.date,
        purchases: d.purchases,
        movingAverage: d.movingAverage,
      }))
    );
  }, [purchaseChartData]);

  const aggregateDataByTimeUnit = (
    purchasesByDate: Map<string, number>,
    dates: string[],
    unit: DataPointUnit
  ): Map<string, number> => {
    const aggregatedData = new Map<string, number>();

    dates.forEach((date) => {
      let periodKey: string;
      const momentDate = moment(date);

      switch (unit) {
        case "weekly":
          // Format: YYYY-[W]WW (e.g., "2024-W12" for week 12 of 2024)
          periodKey = momentDate.format("YYYY-[W]WW");
          break;
        case "monthly":
          // Format: YYYY-MM (e.g., "2024-03" for March 2024)
          periodKey = momentDate.format("YYYY-MM");
          break;
        default:
          // Daily format: YYYY-MM-DD
          periodKey = date;
      }

      const currentValue = purchasesByDate.get(date) || 0;
      aggregatedData.set(
        periodKey,
        (aggregatedData.get(periodKey) || 0) + currentValue
      );
    });

    return aggregatedData;
  };

  const calculatePurchaseData = useCallback(() => {
    if (!dateRange) return;
    const purchasesByDate = new Map();

    // Group purchases by date
    Object.values(purchaseStatuses).forEach((status) => {
      const date = moment(status.purchaseDate).format("YYYY-MM-DD");
      purchasesByDate.set(date, (purchasesByDate.get(date) || 0) + 1);
    });

    // Convert date range to moment dates
    const startDate = moment(
      new Date(
        dateRange.start.year,
        dateRange.start.month - 1,
        dateRange.start.day
      )
    );
    const endDate = moment(
      new Date(dateRange.end.year, dateRange.end.month - 1, dateRange.end.day)
    );

    // Generate array of dates within the selected range
    const daysInRange = endDate.diff(startDate, "days") + 1;
    const dates = [...Array(daysInRange)].map((_, i) => {
      return moment(startDate).add(i, "days").format("YYYY-MM-DD");
    });

    // Aggregate data based on selected time unit
    const aggregatedData = aggregateDataByTimeUnit(
      purchasesByDate,
      dates,
      dataPointUnit
    );

    // Generate data points based on the selected unit
    let dataPoints: { date: string; purchases: number }[] = [];

    switch (dataPointUnit) {
      case "weekly":
        // Group by weeks
        const weeklyDates = Array.from(new Set(aggregatedData.keys())).sort();
        dataPoints = weeklyDates.map((weekKey) => ({
          date: weekKey,
          purchases: aggregatedData.get(weekKey) || 0,
        }));
        break;

      case "monthly":
        // Group by months
        const monthlyDates = Array.from(new Set(aggregatedData.keys())).sort();
        dataPoints = monthlyDates.map((monthKey) => ({
          date: monthKey,
          purchases: aggregatedData.get(monthKey) || 0,
        }));
        break;

      default:
        // Daily data points
        const uniqueDates = Array.from(new Set(dates));
        dataPoints = uniqueDates.map((date) => ({
          date,
          purchases: aggregatedData.get(date) || 0,
        }));
    }

    // Calculate period in data points
    let periodInPoints = selectedPeriod.value;
    switch (selectedPeriod.unit) {
      case "weeks":
        periodInPoints =
          dataPointUnit === "weekly"
            ? selectedPeriod.value
            : dataPointUnit === "monthly"
            ? Math.ceil(selectedPeriod.value / 4)
            : selectedPeriod.value * 7;
        break;
      case "months":
        periodInPoints =
          dataPointUnit === "monthly"
            ? selectedPeriod.value
            : dataPointUnit === "weekly"
            ? selectedPeriod.value * 4
            : selectedPeriod.value * 30;
        break;
    }

    // Calculate moving averages
    const data = dataPoints.map((point, index) => {
      const startIdx = Math.max(0, index - periodInPoints + 1);
      const currentWindow = dataPoints.slice(startIdx, index + 1);

      const sum = currentWindow.reduce((acc, d) => acc + d.purchases, 0);
      const movingAvg =
        currentWindow.length > 0 ? sum / currentWindow.length : 0;

      return {
        date: point.date,
        purchases: point.purchases,
        movingAverage: Number(movingAvg.toFixed(2)),
      };
    });

    setPurchaseChartData(data);
  }, [dateRange, selectedPeriod, purchaseStatuses, dataPointUnit]);

  const getDataPointUnitLabel = (unit: DataPointUnit) => {
    switch (unit) {
      case "daily":
        return "Daily";
      case "weekly":
        return "Weekly";
      case "monthly":
        return "Monthly";
      default:
        return "Daily";
    }
  };
  //   if (!dateRange) return;
  //   const purchasesByDate = new Map();

  //   // Group purchases by date
  //   Object.values(purchaseStatuses).forEach((status) => {
  //     const date = moment(status.purchaseDate).format("YYYY-MM-DD");
  //     purchasesByDate.set(date, (purchasesByDate.get(date) || 0) + 1);
  //   });
  // console.log(purchasesByDate)
  //   // Convert date range to moment dates
  //   const startDate = moment(new Date(
  //     dateRange.start.year,
  //     dateRange.start.month - 1,
  //     dateRange.start.day
  //   ));
  //   const endDate = moment(new Date(
  //     dateRange.end.year,
  //     dateRange.end.month - 1,
  //     dateRange.end.day
  //   ));

  //   // Calculate period in days
  //   let periodInDays = selectedPeriod.value;
  //   switch (selectedPeriod.unit) {
  //     case 'weeks':
  //       periodInDays = selectedPeriod.value * 7;
  //       break;
  //     case 'months':
  //       periodInDays = selectedPeriod.value * 30;
  //       break;
  //   }

  //   // Generate array of dates within the selected range
  //   const daysInRange = endDate.diff(startDate, 'days') + 1;
  //   const dates = [...Array(daysInRange)].map((_, i) => {
  //     return moment(startDate).add(i, 'days').format("YYYY-MM-DD");
  //   });

  //   // Calculate moving average window size
  //   const windowSize = periodInDays;

  //   const data = dates.map((date, index) => {
  //     const purchases = purchasesByDate.get(date) || 0;

  //     // Calculate moving average
  //     let movingAvg = 0;
  //     const startIdx = Math.max(0, index - windowSize + 1);
  //     const currentWindow = dates.slice(startIdx, index + 1);

  //     const sum = currentWindow.reduce(
  //       (acc, d) => acc + (purchasesByDate.get(d) || 0),
  //       0
  //     );
  //     movingAvg = currentWindow.length > 0 ? sum / currentWindow.length : 0;

  //     return {
  //       date,
  //       purchases,
  //       movingAverage: Number(movingAvg.toFixed(2)),
  //     };
  //   });

  //   setPurchaseChartData(data);
  // }, [dateRange, selectedPeriod, purchaseStatuses]);

  useEffect(() => {
    if (
      Object.keys(purchaseStatuses).length > 0 &&
      dateRange?.start &&
      dateRange?.end
    ) {
      calculatePurchaseData();
    }
  }, [purchaseStatuses, dateRange, selectedPeriod, calculatePurchaseData]);

  //     if (!dateRange) return;
  //     const purchasesByDate = new Map();

  //     // Group purchases by date
  //     Object.values(purchaseStatuses).forEach((status) => {
  //       const date = moment(status.purchaseDate).format("YYYY-MM-DD");
  //       purchasesByDate.set(date, (purchasesByDate.get(date) || 0) + 1);
  //     });

  //     // Convert date range to moment dates
  //     const startDate = moment(new Date(
  //       dateRange.start.year,
  //       dateRange.start.month - 1,
  //       dateRange.start.day
  //     ));
  //     const endDate = moment(new Date(
  //       dateRange.end.year,
  //       dateRange.end.month - 1,
  //       dateRange.end.day
  //     ));

  //     let periodInDays = selectedPeriod.value;
  //   switch (selectedPeriod.unit) {
  //     case 'weeks':
  //       periodInDays = selectedPeriod.value * 7;
  //       break;
  //     case 'months':
  //       periodInDays = selectedPeriod.value * 30; // Using 30 days as approximate month length
  //       break;
  //   }

  //     // Extend the start date backwards by selectedPeriod.value days
  //   const extendedStartDate = moment(startDate).subtract(periodInDays, 'days');

  //     // Calculate total days in the selected range
  //     const daysInRange = endDate.diff(startDate, 'days') + 1;

  //     // Generate array of dates within the selected range
  //     const dates = [...Array(daysInRange)].map((_, i) => {
  //       return moment(startDate).add(i, 'days').format("YYYY-MM-DD");
  //     });
  //     console.log("Purchases by date:", purchasesByDate);
  //     // Use a sliding window for moving average
  //     const windowSize = Math.min(selectedPeriod.value, daysInRange);

  //     const data = dates.map((date, index) => {
  //       const purchases = purchasesByDate.get(date) || 0;

  //       // Calculate moving average starting from the first day
  //       let movingAvg = 0;
  //       const startIdx = Math.max(0, index - windowSize + 1);
  //       const currentWindow = dates.slice(startIdx, index + 1);

  //       const sum = currentWindow.reduce(
  //         (acc, d) => acc + (purchasesByDate.get(d) || 0),
  //         0
  //       );
  //       movingAvg = sum / currentWindow.length;

  //       return {
  //         date,
  //         purchases,
  //         movingAverage: Number(movingAvg.toFixed(2)),
  //       };
  //     });
  // console.log("Data:", data);
  //     setPurchaseChartData(data);
  //   };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-default-100 p-2 rounded-lg border border-default-200">
          <p className="text-[#c4c4c4] mb-1">
            {dataPointUnit === "weekly"
              ? `Week ${label.split("-W")[1]}`
              : dataPointUnit === "monthly"
              ? moment(label).format("MMM YYYY")
              : moment(label).format("MMM DD, YYYY")}
          </p>
          {payload.map((entry: any, index: number) => (
            <p
              key={`tooltip-${index}`}
              style={{ color: entry.color }}
              className="text-sm"
            >
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full h-[400px] mt-6 pt-4 px-4">
      <CardHeader className="flex flex-row justify-between items-center">
        <h3 className="text-xl font-bold">Purchase Trends</h3>
        <div className="flex gap-2 items-center">
          <input
            name="averageWindow"
            type="number"
            min={1}
            max={
              dateRange
                ? selectedPeriod.unit === "days"
                  ? Math.min(
                      90,
                      moment(
                        new Date(
                          dateRange.end.year,
                          dateRange.end.month - 1,
                          dateRange.end.day
                        )
                      ).diff(
                        moment(
                          new Date(
                            dateRange.start.year,
                            dateRange.start.month - 1,
                            dateRange.start.day
                          )
                        ),
                        "days"
                      )
                    )
                  : selectedPeriod.unit === "weeks"
                  ? Math.min(
                      52,
                      Math.floor(
                        moment(
                          new Date(
                            dateRange.end.year,
                            dateRange.end.month - 1,
                            dateRange.end.day
                          )
                        ).diff(
                          moment(
                            new Date(
                              dateRange.start.year,
                              dateRange.start.month - 1,
                              dateRange.start.day
                            )
                          ),
                          "weeks"
                        )
                      )
                    )
                  : Math.min(
                      12,
                      Math.floor(
                        moment(
                          new Date(
                            dateRange.end.year,
                            dateRange.end.month - 1,
                            dateRange.end.day
                          )
                        ).diff(
                          moment(
                            new Date(
                              dateRange.start.year,
                              dateRange.start.month - 1,
                              dateRange.start.day
                            )
                          ),
                          "months"
                        )
                      )
                    )
                : 90
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

          <select
            className="bg-default-100 rounded-md p-2 ml-4"
            value={dataPointUnit}
            onChange={(e) => setDataPointUnit(e.target.value as DataPointUnit)}
          >
            <option value="daily">Daily Data</option>
            <option value="weekly">Weekly Data</option>
            <option value="monthly">Monthly Data</option>
          </select>
        </div>
      </CardHeader>
      <CardBody>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={purchaseChartData.map((entry, index) => ({
              ...entry,
              id: `${entry.date}-${index}`, // Add a unique identifier to each data point
            }))}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              textAnchor="end"
              height={60}
              interval={Math.max(Math.floor(purchaseChartData.length / 15), 0)}
              tick={{ fontSize: 12, angle: -45 }}
              tickFormatter={(value) => {
                switch (dataPointUnit) {
                  case "weekly":
                    return `Week ${value.split("-W")[1]}`;
                  case "monthly":
                    return moment(value).format("MMM YYYY");
                  default:
                    return moment(value).format("MMM DD");
                }
              }}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              key={`bar-${Date.now()}`}
              dataKey="purchases"
              fill="#8884d8"
              name={`${getDataPointUnitLabel(dataPointUnit)} Purchases`}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="movingAverage"
              stroke="#82ca9d"
              fill="#82ca9d"
              fillOpacity={0.3}
              name={`${selectedPeriod.value}-${selectedPeriod.unit.slice(
                0,
                -1
              )} moving average of ${getDataPointUnitLabel(
                dataPointUnit
              ).toLowerCase()} purchases`}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
