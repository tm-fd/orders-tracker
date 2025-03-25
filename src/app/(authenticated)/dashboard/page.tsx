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
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
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
  ComposedChart,
  Area,
} from "recharts";
import usePurchaseStore from "@/store/purchaseStore";
import { DatePickerIcon } from "@/components/icons";
import { data } from "framer-motion/client";
import type { RangeValue } from "@react-types/shared";
import type { DateValue } from "@react-types/datepicker";
import moment from "moment";
import { parseDate } from "@internationalized/date";
import PurchaseTrends from "@/components/PurchaseTrends";
import ActivationsTrend from "@/components/ActivationsTrend";



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

  const [activeUsersNotTrained, setActiveUsersNotTrained] = useState(0);
  const [trainedUsers, setTrainedUsers] = useState(0);
  const [invalidUsers, setInvalidUsers] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dateRange, setDateRange] = useState<RangeValue<DateValue> | null>({
    start: parseDate(moment().subtract(360, "days").format("YYYY-MM-DD")),
    end: parseDate(moment().format("YYYY-MM-DD")),
  });
 
  const [datePrecision, setDatePrecision] = useState("exact_dates");

  useEffect(() => {
    console.log(purchaseStatuses);
    if (!isLoading && Object.keys(purchaseStatuses).length > 0) {
      updateUserStatusCounts();
    }
  }, [purchaseStatuses, isLoading]);

  useEffect(() => {
    handleDateRangeChange(dateRange);
  }, [dateRange]);

  const updateUserStatusCounts = () => {
    // Count users who have started training and are not invalid
    const activeTrainedCount =
      Object.values(purchaseStatuses).filter(isTrained).length;
    const inactiveTrainedCount =
      Object.values(purchaseStatuses).filter(isActiveNotTrained).length;
    const invalidCount =
      Object.values(purchaseStatuses).filter(isInvalidAccount).length;
    setActiveUsersNotTrained(inactiveTrainedCount);
    setTrainedUsers(activeTrainedCount);
    setInvalidUsers(invalidCount);
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
    const activationButNotTrained = status.activationRecords?.some(
      (record) =>
        record.user !== null && record.user?.training_session_data?.length === 0
    );
    return activationButNotTrained;
  };

  const isTrained = (status: any) => checkStartedTraining(status) === true;
  const isActiveNotTrained = (status: any) =>
    checkActiveButNotTrained(status) === true;
  const isInvalidAccount = (status: any) =>
    checkAccountValidity(status) === true;

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
      console.log(start, end);
      setDateRange({ start, end });
    }
  };

  return (
    <div className="min-h-screen w-full p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <DateRangePicker
        CalendarBottomContent={
          <RadioGroup
            aria-label="Date precision"
            classNames={{
              base: "w-full pb-2",
              wrapper:
                "-my-2.5 py-2.5 px-3 gap-1 flex-nowrap max-w-[w-[calc(var(--visible-months)_*_var(--calendar-width))]] overflow-scroll",
            }}
            defaultValue="exact_dates"
            orientation="horizontal"
            value={datePrecision}
            onValueChange={handlePrecisionChange}
          >
            <CustomRadio value="7_days">7 days</CustomRadio>
            <CustomRadio value="14_days">14 days</CustomRadio>
            <CustomRadio value="month">1 month</CustomRadio>
            <CustomRadio value="3_month">3 months</CustomRadio>
            <CustomRadio value="6_month">6 months</CustomRadio>
            <CustomRadio value="year">1 year</CustomRadio>
          </RadioGroup>
        }
        aria-label="Date range"
        DatePickerIcon={"Date range"}
        value={dateRange}
        pageBehavior="single"
        onChange={setDateRange}
        selectorIcon={<DatePickerIcon className="text-xl" />}
        visibleMonths={2}
      />
        <Modal
          backdrop="blur"
          isOpen={isLoading}
          placement="top-center"
          classNames={{
            closeButton: "hidden",
            wrapper: "z-[1000000]",
            backdrop: "fixed inset-0 z-[1000000]",  
          }}
          className="bg-transparent shadow-none"
          isDismissable={false}
          shadow="sm"
          isKeyboardDismissDisabled={true}
        >
          <ModalContent>
            {() => (
              <>
                <ModalBody className="flex flex-col h-20">
                  <Spinner size="lg" color="secondary" />
                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>
      
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/10 dark:bg-default-100/50">
          <CardHeader className="pb-2 pt-4 px-4 flex-col items-start">
            <p className="text-tiny uppercase font-bold">Active Users </p>
            <small className="text-default-500">
              Current activated accounts but not trained yet
            </small>
          </CardHeader>
          <CardBody className="py-4">
            <h1 className="text-4xl font-bold">{activeUsersNotTrained}</h1>
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
            <h1 className="text-4xl font-bold">{trainedUsers}</h1>
          </CardBody>
        </Card>
        <Card className="bg-white/10 dark:bg-default-100/50">
          <CardHeader className="pb-2 pt-4 px-4 flex-col items-start">
            <p className="text-tiny uppercase font-bold">Inactive Users</p>
            <small className="text-default-500">Current invalid accounts</small>
          </CardHeader>
          <CardBody className="py-4">
            <h1 className="text-4xl font-bold">{invalidUsers}</h1>
          </CardBody>
        </Card>
      </div>
      <PurchaseTrends dateRange={dateRange} />
      <ActivationsTrend dateRange={dateRange} />
    </div>
  );
}
