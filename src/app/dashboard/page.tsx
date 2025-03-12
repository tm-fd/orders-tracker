"use client";

import {
  Card,
  CardBody,
  CardHeader,
  datePicker,
  DateRangePicker,
} from "@heroui/react";
import { use, useEffect, useState } from "react";
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
import usePurchaseStore from "@/app/store/purchaseStore";
import { DatePickerIcon } from "@/components/icons";
import { data } from "framer-motion/client";
import type { RangeValue } from "@react-types/shared";
import type { DateValue } from "@react-types/datepicker";
import moment from "moment";
import { parseDate } from "@internationalized/date";

export default function DashboardPage() {
  const {
    purchases,
    purchaseStatuses,
    setPurchaseStatus,
    fetchPurchaseStatusesByDateRange,
    setError,
    error,
    isLoading,
  } = usePurchaseStore();

  const [activeUsers, setActiveUsers] = useState(0);
  const [inactiveUsers, setInactiveUsers] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dateRange, setDateRange] = useState<RangeValue<DateValue> | null>({
    start: parseDate(moment().subtract(30, "days").format("YYYY-MM-DD")),
    end: parseDate(moment().format("YYYY-MM-DD")),
  });

  useEffect(() => {
     console.log(purchaseStatuses);
    const calculateActiveUsers = () => {
      // Count users who have started training and are not invalid
      const activeCount =
        Object.values(purchaseStatuses).filter(checkActiveButNotTrained).length;
      const inactiveCount =
        Object.values(purchaseStatuses).filter(isAccountInvalid).length;
      setActiveUsers(activeCount);
      setInactiveUsers(inactiveCount);

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

    if (!isLoading && Object.keys(purchaseStatuses).length > 0) {
      calculateActiveUsers();
    }
  }, [purchaseStatuses, isLoading]);

  

  useEffect(() => {
    handleDateRangeChange(dateRange);
  }, [dateRange]);

  const checkAccountValidity = (status: any) => {
    const userActivation = status.activationRecords?.find(
      (record) => record.user !== null
    );
    if (!userActivation?.user?.valid_until) return null;
    return moment(userActivation.user.valid_until).isAfter(moment());
  };

  const checkActiveButNotTrained = (status: any) => {
    const activationButNotTrained = status.activationRecords?.find(
      (record) => record.user !== null
    );
    return activationButNotTrained.user.training_session_data.length === 0
  };

  const isAccountValid = (status: any) => checkAccountValidity(status) === true;
  const isAccountInvalid = (status: any) =>
    checkAccountValidity(status) === false;

  const handleDateRangeChange = async (dateRange: any) => {
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(
        dateRange.start.year,
        dateRange.start.month - 1, // Months in JS are 0-based
        dateRange.start.day
      );

      const endDate = new Date(
        dateRange.end.year,
        dateRange.end.month - 1, // Months in JS are 0-based
        dateRange.end.day
      );

      await fetchPurchaseStatusesByDateRange(startDate, endDate);
    }
  };

  return (
    <div className="min-h-screen w-full p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <DateRangePicker
        aria-label="Date range"
        DatePickerIcon={"Date range"}
        value={dateRange}
        pageBehavior="single"
        onChange={setDateRange}
        selectorIcon={<DatePickerIcon className="text-xl" />}
        visibleMonths={2}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/10 dark:bg-default-100/50">
          <CardHeader className="pb-2 pt-4 px-4 flex-col items-start">
            <p className="text-tiny uppercase font-bold">Active Users </p>
            <small className="text-default-500">Current activated accounts but not trained yet</small>
          </CardHeader>
          <CardBody className="py-4">
            <h1 className="text-4xl font-bold">{activeUsers}</h1>
          </CardBody>
        </Card>

        <Card className="bg-white/10 dark:bg-default-100/50">
          <CardHeader className="pb-2 pt-4 px-4 flex-col items-start">
            <p className="text-tiny uppercase font-bold">Total Purchases</p>
            <small className="text-default-500">All-time purchases</small>
          </CardHeader>
          <CardBody className="py-4">
            <h1 className="text-4xl font-bold">
              {Object.keys(purchaseStatuses).length}
            </h1>
          </CardBody>
        </Card>

        <Card className="bg-white/10 dark:bg-default-100/50">
          <CardHeader className="pb-2 pt-4 px-4 flex-col items-start">
            <p className="text-tiny uppercase font-bold">Started Training</p>
            <small className="text-default-500">Users in training</small>
          </CardHeader>
          <CardBody className="py-4">
            <h1 className="text-4xl font-bold">
              {
                Object.values(purchaseStatuses).filter((status) => {
                  const userActivation = status.activationRecords?.find(
                    (record) => record.user !== null
                  );
                  return (
                    isAccountValid(status) &&
                    status.activationRecords &&
                    status.activationRecords.length > 0 &&
                    userActivation?.user?.training_session_data?.length > 0
                  );
                }).length
              }
            </h1>
          </CardBody>
        </Card>
        <Card className="bg-white/10 dark:bg-default-100/50">
          <CardHeader className="pb-2 pt-4 px-4 flex-col items-start">
            <p className="text-tiny uppercase font-bold">Inactive Users</p>
            <small className="text-default-500">Current invalid accounts</small>
          </CardHeader>
          <CardBody className="py-4">
            <h1 className="text-4xl font-bold">{inactiveUsers}</h1>
          </CardBody>
        </Card>
      </div>

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
                interval={0} // Show all ticks
                tick={{ fontSize: 12 }}
                domain={["dataMin", "dataMax"]} // Use the full date range
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="activations" fill="#0070F3" />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </div>
  );
}
