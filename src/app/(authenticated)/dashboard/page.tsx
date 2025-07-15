"use client";

import {
  Card,
  CardBody,
  CardHeader,
  datePicker,
  DateRangePicker,
  Radio,
  RadioGroup,
  Button,
  ButtonGroup,
  cn,
  Skeleton,
} from "@heroui/react";
import { use, useCallback, useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from "recharts";
import usePurchaseStore from "@/store/purchaseStore";
import { DatePickerIcon, LoadingBars } from "@/components/icons";
import { data } from "framer-motion/client";
import type { RangeValue } from "@react-types/shared";
import type { DateValue } from "@react-types/datepicker";
import moment from "moment";
import { parseDate } from "@internationalized/date";
import PurchaseTrends from "@/components/dashboard/PurchaseTrends";
import ActivationsTrend from "@/components/dashboard/ActivationsTrend";
import { LoadingModal } from "@/components/LoadingModal";
import "../../dark.css";
import Flatpickr from "react-flatpickr";
import { useTheme } from "next-themes";

export default function DashboardPage() {
  const {
    purchases,
    purchaseStatuses,
    fetchPurchaseStatusesByDateRange,
    setError,
    error,
    isLoading,
  } = usePurchaseStore();

  const [activeUsersNotTrained, setActiveUsersNotTrained] = useState(0);
  const [activeNotTrainedStudents, setActiveNotTrainedStudents] = useState(0);
  const [trainedUsers, setTrainedUsers] = useState(0);
  const [invalidUsers, setInvalidUsers] = useState(0);
  const [validUsersAndTrainedlast12Weeks, setValidUsersAndTrainedlast12Weeks] =
    useState(0);
  const [chartData, setChartData] = useState([]);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dateRange, setDateRange] = useState<RangeValue<DateValue> | null>({
    start: parseDate(moment().subtract(360, "days").format("YYYY-MM-DD")),
    end: parseDate(moment().format("YYYY-MM-DD")),
  });
  const [last12WeeksStatuses, setLast12WeeksStatuses] = useState<
    Record<number, any>
  >({});
  const [isLoadingLast12Weeks, setIsLoadingLast12Weeks] = useState(false);
  const [datePrecision, setDatePrecision] = useState("exact_dates");
  const { theme, setTheme } = useTheme();
  const [isLoadingValidUsers, setIsLoadingValidUsers] = useState(true);

  useEffect(() => {
    console.log(theme);
    const root = document.documentElement;
    root.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
  }, [theme]);

  useEffect(() => {
    if (!isLoading && Object.keys(purchaseStatuses).length > 0) {
      updateUserStatusCounts();
    }
  }, [purchaseStatuses, isLoading]);

  useEffect(() => {
    if (Object.keys(purchaseStatuses).length > 0) {
      update12WeeksUserStatusCounts();
    }
  }, [purchaseStatuses, isLoadingLast12Weeks]);

  useEffect(() => {
    handleDateRangeChange(dateRange);
  }, [dateRange]);

  const updateUserStatusCounts = async () => {
    // Count users who have started training and are not invalid
    const activeTrainedCount =
      Object.values(purchaseStatuses).filter(isTrained).length;
    const inactiveTrainedCount =
      Object.values(purchaseStatuses).filter(isActiveNotTrained).length;
    const invalidCount =
      Object.values(purchaseStatuses).filter(isInvalidAccount).length;
    const activeNotTrainedStudentCount = Object.values(purchaseStatuses).filter(
      checkActiveNotTrainedStudents
    ).length;

    setActiveUsersNotTrained(inactiveTrainedCount);
    setTrainedUsers(activeTrainedCount);
    setInvalidUsers(invalidCount);
    setActiveNotTrainedStudents(activeNotTrainedStudentCount);
  };

  const update12WeeksUserStatusCounts = async () => {
    setIsLoadingValidUsers(true);
    try {
      const statuses = await checkActiveAndTrainedLast12Weeks();
      const validCountAndTraindLast12Weeks = Object.values(statuses).filter(
        (status: any) => {
          const activationAndTrainedRecently = status.activationRecords?.some(
            (record) => {
              if (
                !record.user ||
                !record.user.training_session_data?.length ||
                !record.user.valid_until
              )
                return false;

              const validUntilDate = moment(record.user.valid_until);
              if (!validUntilDate.isAfter(moment())) return false;

              const lastTrainingSession =
                record.user.training_session_data[
                  record.user.training_session_data.length - 1
                ];

              if (!lastTrainingSession.start_time) return false;

              const twelveWeeksAgo = moment().subtract(12, "weeks");
              const sessionDate = moment(lastTrainingSession.start_time);
              return sessionDate.isAfter(twelveWeeksAgo);
            }
          );

          return activationAndTrainedRecently;
        }
      ).length;

      setValidUsersAndTrainedlast12Weeks(validCountAndTraindLast12Weeks);
    } catch (error) {
      console.error("Error updating user status counts:", error);
    } finally {
      setIsLoadingValidUsers(false);
    }
  };

  const checkAccountValidity = (status: any) => {
    const userActivation = status.activationRecords?.find(
      (record) =>
        record.user !== null && record.user?.training_session_data?.length === 0
    );
    if (!userActivation?.user?.valid_until) return null;
    return moment(userActivation.user.valid_until).isBefore(moment());
  };

  const checkStartedTraining = (status: any) => {
    const activationTrained = status.activationRecords?.some(
      (record) =>
        record.user !== null && record.user?.training_session_data?.length > 0
    );
    return activationTrained;
  };

  const checkActiveButNotTrained = (status: any) => {
    const isImported = status.additionalInfo?.some(
      (info) => info.purchase_source === "IMPORTED"
    );
    if (isImported) return false;

    const activationButNotTrained = status.activationRecords?.some(
      (record) =>
        record.user !== null && record.user?.training_session_data?.length === 0
    );
    return activationButNotTrained;
  };

  const checkActiveButNotTrainedStudents = (
    status: any,
    onlyImported: boolean = false
  ) => {
    const isImported = status.additionalInfo?.some(
      (info) => info.purchase_source === "IMPORTED"
    );

    // Return false if we're looking for non-imported but it is imported
    // or if we're looking for imported but it's not imported
    if (onlyImported ? !isImported : isImported) return false;

    const activationButNotTrainedStudents = status.activationRecords?.some(
      (record) =>
        record.user !== null && record.user?.training_session_data?.length === 0
    );
    return activationButNotTrainedStudents;
  };

  const checkActiveAndTrainedLast12Weeks = useCallback(async () => {
    try {
      if (Object.keys(last12WeeksStatuses).length === 0) {
        setIsLoadingLast12Weeks(true);
        const startDate = parseDate("2023-12-01");
        const endDate = parseDate(moment().format("YYYY-MM-DD"));
        const apiStartDate = new Date(
          startDate.year,
          startDate.month - 1, // Months in JS are 0-based
          startDate.day
        );

        const apiEndDate = new Date(
          endDate.year,
          endDate.month - 1,
          endDate.day
        );

        const response = await fetch(
          `${
            process.env.CLOUDRUN_DEV_URL
          }/purchases/all-info-by-date-range?startDate=${apiStartDate.toISOString()}&endDate=${apiEndDate.toISOString()}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch last 12 weeks statuses");
        }

        const data = await response.json();
        setLast12WeeksStatuses(data);
        setIsLoadingLast12Weeks(false);
        return data;
      }
      return last12WeeksStatuses;
    } catch (error) {
      console.error("Error fetching last 12 weeks data:", error);
      return {};
    }
  }, [last12WeeksStatuses]);

  const isTrained = (status: any) => checkStartedTraining(status) === true;
  const isActiveNotTrained = (status: any) =>
    checkActiveButNotTrained(status) === true;
  const isInvalidAccount = (status: any) =>
    checkAccountValidity(status) === true;
  const isActiveAndTraindLast12Weeks = (status: any) =>
    checkActiveAndTrainedLast12Weeks(status) === true;
  const checkActiveNotTrainedStudents = (status: any) =>
    checkActiveButNotTrainedStudents(status, true) === true;

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

  const CustomRadio = (props) => {
    const { children, ...otherProps } = props;

    return (
      <Radio
        {...otherProps}
        classNames={{
          base: cn(
            "flex-none m-0 h-8 bg-content1 hover:bg-content2 items-center justify-between",
            "cursor-pointer rounded-full border-2 border-default-200/60",
            "data-[selected=true]:border-primary"
          ),
          label: "text-tiny text-default-500",
          labelWrapper: "px-1 m-0",
          wrapper: "hidden",
        }}
      >
        {children}
      </Radio>
    );
  };

  const handlePrecisionChange = (value: string) => {
    setDatePrecision(value);

    // Calculate new date range based on selection
    const end = parseDate(moment().format("YYYY-MM-DD"));
    let start;

    switch (value) {
      case "month":
        start = parseDate(moment().subtract(30, "days").format("YYYY-MM-DD"));
        break;
      case "3_month":
        start = parseDate(moment().subtract(90, "days").format("YYYY-MM-DD"));
        break;
      case "6_month":
        start = parseDate(moment().subtract(180, "days").format("YYYY-MM-DD"));
        break;
      case "7_days":
        start = parseDate(moment().subtract(7, "days").format("YYYY-MM-DD"));
        break;
      case "14_days":
        start = parseDate(moment().subtract(14, "days").format("YYYY-MM-DD"));
        break;
      case "year":
        start = parseDate(moment().subtract(360, "days").format("YYYY-MM-DD"));
        break;
      default:
        return; // Don't modify range for exact_dates
    }

    if (start) {
      setDateRange({ start, end });
    }
  };

  return (
    <div className="min-h-screen w-full p-8 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="flex items-center gap-2 w-full max-w-md relative">
        <Flatpickr
          options={{
            mode: "range",
            weekNumbers: true,
            enableTime: false,
            dateFormat: "Y-m-d",
            defaultDate: [
              dateRange?.start
                ? new Date(
                    dateRange.start.year,
                    dateRange.start.month - 1,
                    dateRange.start.day
                  )
                : moment().subtract(360, "days").toDate(),
              dateRange?.end
                ? new Date(
                    dateRange.end.year,
                    dateRange.end.month - 1,
                    dateRange.end.day
                  )
                : moment().toDate(),
            ],
            positionElement: null,
            position: "auto right",
            onReady: (selectedDates, dateStr, instance) => {
              // Force initial position to end date
              const endDate = dateRange?.end
                ? new Date(
                    dateRange.end.year,
                    dateRange.end.month - 1,
                    dateRange.end.day
                  )
                : moment().toDate();
              instance.currentYear = endDate.getFullYear();
              instance.currentMonth = endDate.getMonth();
              instance.redraw();

              // Ensure end date is selected
              instance.latestSelectedDateObj = instance.selectedDates[1];
            },
            onOpen: (selectedDates, dateStr, instance) => {
              // Jump to end date's month
              const endDate = instance.selectedDates[1];
              if (endDate) {
                instance.currentYear = endDate.getFullYear();
                instance.currentMonth = endDate.getMonth();
                instance.redraw();

                // Force focus on end date
                instance.latestSelectedDateObj = instance.selectedDates[1];
              }
            },
            onChange: (dates) => {
              if (dates.length === 2) {
                const [start, end] = dates;
                setDateRange({
                  start: parseDate(moment(start).format("YYYY-MM-DD")),
                  end: parseDate(moment(end).format("YYYY-MM-DD")),
                });
              }
            },
          }}
          value={[
            dateRange?.start
              ? new Date(
                  dateRange.start.year,
                  dateRange.start.month - 1,
                  dateRange.start.day
                )
              : moment().subtract(360, "days").toDate(),
            dateRange?.end
              ? new Date(
                  dateRange.end.year,
                  dateRange.end.month - 1,
                  dateRange.end.day
                )
              : moment().toDate(),
          ]}
          className="w-full px-3 py-2 border rounded-md focus:outline-none"
          placeholder="Select date range..."
        />
        <div className="absolute inset-y-0 right-3 pl-3 flex items-center pointer-events-none">
          <DatePickerIcon className="w-5 h-5 text-gray-400" />
        </div>
      </div>
      <LoadingModal
        isOpen={isLoading || (isLoadingLast12Weeks && !isLoadingValidUsers)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card className="bg-white/10 dark:bg-default-100/50 justify-end">
          <CardHeader className="pb-2 pt-4 px-4 flex-col items-start">
            <p className="text-tiny uppercase font-bold">
              Active Users & trained{" "}
            </p>
            <small className="text-default-500">
              Current active accounts and trained in the last 12 weeks
            </small>
          </CardHeader>
          <CardBody className="py-4 justify-end">
            <Skeleton
              className="w-2/5 rounded-lg"
              isLoaded={!isLoadingValidUsers}
            >
              <h1 className="text-4xl font-bold">
                {validUsersAndTrainedlast12Weeks}
              </h1>
            </Skeleton>
          </CardBody>
        </Card>

        <Card className="bg-white/10 dark:bg-default-100/50">
          <CardHeader className="pb-2 pt-4 px-4 flex-col items-start">
            <p className="text-tiny uppercase font-bold">
              Active Users - Not trained{" "}
            </p>
            <small className="text-default-500">
              Current activated accounts but not trained yet (Not students)
            </small>
          </CardHeader>
          <CardBody className="py-4 justify-end">
            <h1 className="text-4xl font-bold">{activeUsersNotTrained}</h1>
          </CardBody>
        </Card>

        <Card className="bg-white/10 dark:bg-default-100/50">
          <CardHeader className="pb-2 pt-4 px-4 flex-col items-start">
            <p className="text-tiny uppercase font-bold">
              Students - Not trained
            </p>
            <small className="text-default-500">
              Students accounts activated but not trained yet
            </small>
          </CardHeader>
          <CardBody className="py-4 justify-end">
            <h1 className="text-4xl font-bold">{activeNotTrainedStudents}</h1>
          </CardBody>
        </Card>

        <Card className="bg-white/10 dark:bg-default-100/50">
          <CardHeader className="pb-2 pt-4 px-4 flex-col items-start">
            <p className="text-tiny uppercase font-bold">Total Purchases</p>
            <small className="text-default-500">All-time purchases</small>
          </CardHeader>
          <CardBody className="py-4 justify-end">
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
          <CardBody className="py-4 justify-end">
            <h1 className="text-4xl font-bold">{trainedUsers}</h1>
          </CardBody>
        </Card>
        <Card className="bg-white/10 dark:bg-default-100/50">
          <CardHeader className="pb-2 pt-4 px-4 flex-col items-start">
            <p className="text-tiny uppercase font-bold">Inactive Users</p>
            <small className="text-default-500">Current invalid accounts</small>
          </CardHeader>
          <CardBody className="py-4 justify-end">
            <h1 className="text-4xl font-bold">{invalidUsers}</h1>
          </CardBody>
        </Card>
      </div>
      <PurchaseTrends dateRange={dateRange} />
      <ActivationsTrend dateRange={dateRange} />
    </div>
  );
}
