"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Input,
  Button,
  Select,
  SelectItem,
  Pagination,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Spacer,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  Switch,
} from "@heroui/react";
import {
  Search,
  Filter,
  RotateCcw,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  User,
  MessageSquare,
  Database,
  Eye,
  EyeOff,
} from "lucide-react";
import { LoadingModal } from "@/components/LoadingModal";
import "../../dark.css";
import Flatpickr from "react-flatpickr";
import moment from "moment";
import { useTheme } from "next-themes";


// Types
interface LogEntry {
  key: string;
  level: string;
  message: string;
  meta?: Record<string, any>;
  "@timestamp": string;
  _uniqueId?: string;
}

interface GroupedLogEntry {
  key: string;
  count: number;
  latest_timestamp: string;
  recent_logs: LogEntry[];
}

interface SearchResponse {
  items: LogEntry[];
  total: number;
  from: number;
  size: number;
}

interface GroupedSearchResponse {
  groups: GroupedLogEntry[];
  total_groups: number;
  from: number;
  size: number;
}

interface LogFilters {
  q: string;
  level: string;
  key: string;
  groupBy: string;
  from: number;
  size: number;
  recent_logs: number;
  startDate: string;
  endDate: string;
}

export default function LogsPage() {
  const { theme, setTheme } = useTheme();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [groupedLogs, setGroupedLogs] = useState<GroupedLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [isGrouped, setIsGrouped] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupedLogEntry | null>(
    null
  );
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const resetFilters = {
    q: "",
    level: "",
    key: "",
    groupBy: "key",
    from: 0,
    size: 50,
    recent_logs: 10,
    startDate: "",
    endDate: "",
  };

  const [filters, setFilters] = useState<LogFilters>(resetFilters);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInputValue, setPageInputValue] = useState("");

  const logLevels = [
    { value: "", label: "All Levels" },
    { value: "error", label: "Error" },
    { value: "warn", label: "Warning" },
    { value: "info", label: "Info" },
    { value: "debug", label: "Debug" },
  ];

  const groupByOptions = [
    { value: "", label: "No Grouping" },
    { value: "key", label: "Group by Key" }
  ];

  const fetchLogs = async (searchFilters: LogFilters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (searchFilters.q) params.append("q", searchFilters.q);
      if (searchFilters.level) params.append("level", searchFilters.level);
      if (searchFilters.key) params.append("key", searchFilters.key);
      if (searchFilters.groupBy)
        params.append("groupBy", searchFilters.groupBy);
      if (searchFilters.startDate) params.append("startDate", searchFilters.startDate);
      if (searchFilters.endDate) params.append("endDate", searchFilters.endDate);
      params.append("from", Math.max(0, searchFilters.from).toString());
      params.append("size", searchFilters.size.toString());
      params.append("recent_logs", searchFilters.recent_logs.toString());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_LOGS_API_URL}/logs?${params}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) throw new Error(response.statusText);

      const data = await response.json();
      console.log(data);
      if (searchFilters.groupBy) {
        const groupedData = data as GroupedSearchResponse;
        setGroupedLogs(groupedData.groups);
        setTotalItems(groupedData.total_groups);
        const newTotalPages = Math.ceil(groupedData.total_groups / searchFilters.size);
        setTotalPages(newTotalPages);
        setIsGrouped(true);

        // Adjust current page if it's beyond the new total pages
        if (newTotalPages > 0 && currentPage > newTotalPages) {
          setCurrentPage(newTotalPages);
        }
      } else {
        const regularData = data as SearchResponse;
        setLogs(regularData.items);
        setTotalItems(regularData.total);
        const newTotalPages = Math.ceil(regularData.total / searchFilters.size);
        setTotalPages(newTotalPages);
        setIsGrouped(false);

        // Adjust current page if it's beyond the new total pages
        if (newTotalPages > 0 && currentPage > newTotalPages) {
          setCurrentPage(newTotalPages);
        }
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

   useEffect(() => {
    console.log(theme);
    const root = document.documentElement;
    root.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
  }, [theme]);

  useEffect(() => {
    fetchLogs(filters);
  }, [filters]);

  const handleSearch = () => {
    const newFilters = { ...filters, from: 0 };
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setFilters(resetFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    // Ensure page is within valid bounds
    const validPage = Math.max(1, Math.min(page, totalPages));
    const from = Math.max(0, (validPage - 1) * filters.size);

    const newFilters = { ...filters, from };
    setFilters(newFilters);
    setCurrentPage(validPage);

    // Clear page input when navigating via pagination buttons
    setPageInputValue("");
  };

  const handlePageInputSubmit = () => {
    const pageNumber = parseInt(pageInputValue, 10);
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      handlePageChange(pageNumber);
      setPageInputValue("");
    } else if (!isNaN(pageNumber)) {
      // If number is out of range, go to the closest valid page
      const validPage = Math.max(1, Math.min(pageNumber, totalPages));
      handlePageChange(validPage);
      setPageInputValue("");
    }
  };

  const handlePageInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePageInputSubmit();
    }
  };

  const handleGroupClick = (group: GroupedLogEntry) => {
    setSelectedGroup(group);
    setSelectedLog(null); // Clear individual log selection
    onOpen();
  };

  const handleLogClick = (log: LogEntry) => {
    setSelectedLog(log);
    setSelectedGroup(null); // Clear group selection
    onOpen();
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "error":
        return "danger";
      case "warn":
        return "warning";
      case "info":
        return "primary";
      case "debug":
        return "secondary";
      default:
        return "default";
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case "error":
        return <XCircle className="w-4 h-4" />;
      case "warn":
        return <AlertTriangle className="w-4 h-4" />;
      case "info":
        return <Info className="w-4 h-4" />;
      case "debug":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
  };

  function formatMeta(obj: any): string {
    if (obj === null) return "null";
    if (typeof obj !== "object") {
      return typeof obj === "string" ? `'${obj}'` : String(obj);
    }
    const entries = Object.entries(obj).map(([k, v]) => {
      const val = formatMeta(v);
      return `${k}: ${val}`;
    });
    return `{ ${entries.join(", ")} }`;
  }

  const formatGroupKey = (key: string, groupBy: string) => {
    if (groupBy === "date") {
      return moment(key).format('YYYY-MM-DD');
    }
    return key;
  };

  const onClear = useCallback(() => {
    setFilters(resetFilters);
    setCurrentPage(1);
  }, []);

  const onSearchChange = useCallback((value?: string) => {
    if (value) {
      setFilters({ ...filters, q: value, from: 0 });
      setCurrentPage(1);
    } else {
      setFilters({ ...resetFilters, startDate: filters.startDate, endDate: filters.endDate });
      setCurrentPage(1);
    }
  }, [filters]);

  const setDateRange = (hours: number) => {
    const now = moment();
    const startDate = moment().subtract(hours, 'hours');

    // Format for datetime-local input (YYYY-MM-DDTHH:MM)
    const formatForInput = (date: moment.Moment) => {
      return date.format('YYYY-MM-DDTHH:mm');
    };

    setFilters({
      ...filters,
      startDate: formatForInput(startDate),
      endDate: formatForInput(now),
      from: 0,
    });
    setCurrentPage(1);
  };

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-gray-100 space-y-6">
      <Card className="bg-gray-800">
        <CardHeader>
          <h1 className="text-3xl font-bold text-white">Application Logs</h1>
        </CardHeader>
        <CardBody>
          <div className="">
            {/* Search and Filters */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <Input
                  placeholder="Search logs..."
                  isClearable
                  value={filters.q}
                  startContent={<Search className="w-4 h-4" />}
                  className="md:flex-1"
                  onClear={() => onClear()}
                  onValueChange={onSearchChange}
                />
                {isGrouped && (
                  <Input
                    placeholder="Recent logs per group"
                    type="number"
                    value={filters.recent_logs.toString()}
                    onChange={(e) => {
                      setFilters({
                        ...filters,
                        recent_logs: Math.max(
                          1,
                          Math.min(100, parseInt(e.target.value) || 10)
                        ),
                        from: 0,
                      });
                      setCurrentPage(1);
                    }}
                    startContent={<Database className="w-4 h-4" />}
                    className="md:w-48"
                    description="1-100 logs per group"
                  />
                )}
                <Select
                  placeholder="Select level"
                  selectedKeys={filters.level ? [filters.level] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setFilters({ ...filters, level: selected || "", from: 0 });
                    setCurrentPage(1);
                  }}
                  className="md:w-48"
                >
                  {logLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  placeholder="Group by"
                  selectedKeys={filters.groupBy ? [filters.groupBy] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setFilters({ ...filters, groupBy: selected || "", from: 0 });
                    setCurrentPage(1);
                  }}
                  className="md:w-48"
                >
                  {groupByOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Date Range Toggle */}
              <div className="flex items-center gap-3">
                <Switch
                  isSelected={showDatePicker}
                  onValueChange={setShowDatePicker}
                  size="sm"
                >
                  Show Date Filters
                </Switch>
              </div>

              {/* Date Range Filters */}
              {showDatePicker && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row gap-4 items-start">
                    <div className="md:w-64">
                      <label className="block text-xs font-medium text-gray-300 mb-2">
                        Start Date & Time
                      </label>
                      <div className="relative">
                        <Flatpickr
                          options={{
                            enableTime: true,
                            dateFormat: "Y-m-d H:i",
                            time_24hr: true,
                          }}
                          value={filters.startDate}
                          onChange={(dates) => {
                            if (dates.length > 0) {
                              const formattedDate = moment(dates[0]).format('YYYY-MM-DDTHH:mm');
                              setFilters({ ...filters, startDate: formattedDate, from: 0 });
                              setCurrentPage(1);
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                          placeholder="Select start date & time"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          <Calendar className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    <div className="md:w-64">
                      <label className="block text-xs font-medium text-gray-300 mb-2">
                        End Date & Time
                      </label>
                      <div className="relative">
                        <Flatpickr
                          options={{
                            enableTime: true,
                            dateFormat: "Y-m-d H:i",
                            time_24hr: true,
                            allowInput: true,
                          }}
                          value={filters.endDate}
                          onChange={(dates) => {
                            if (dates.length > 0) {
                              const formattedDate = moment(dates[0]).format('YYYY-MM-DDTHH:mm');
                              setFilters({ ...filters, endDate: formattedDate, from: 0 });
                              setCurrentPage(1);
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                          placeholder="Select end date & time"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          <Calendar className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Date Range Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="flat"
                      onClick={() => setDateRange(1)}
                      startContent={<Clock className="w-3 h-3" />}
                    >
                      Last Hour
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      onClick={() => setDateRange(24)}
                      startContent={<Clock className="w-3 h-3" />}
                    >
                      Last 24 Hours
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      onClick={() => setDateRange(24 * 7)}
                      startContent={<Clock className="w-3 h-3" />}
                    >
                      Last Week
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      color={filters.startDate || filters.endDate ? "danger" : "default"}
                      onClick={() => {
                        setFilters({ ...filters, startDate: "", endDate: "", from: 0 });
                        setCurrentPage(1);
                      }}
                      startContent={<RotateCcw className="w-3 h-3" />}
                    >
                      Clear Dates
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button
                onClick={handleReset}
                variant="flat"
                startContent={<RotateCcw className="w-4 h-4" />}
              >
                Reset
              </Button>
            </div>

            <Spacer />

            {/* Results Info */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-400">
                <p>
                  Showing {isGrouped ? groupedLogs.length : logs.length} of{" "}
                  {totalItems} {isGrouped ? "groups" : "logs"}
                  {isGrouped && ` (${filters.recent_logs} recent logs per group)`}
                </p>
                {(filters.startDate || filters.endDate) && (
                  <p className="text-xs text-gray-500 mt-1">
                    Filtered by date: {filters.startDate && `from ${moment(filters.startDate).format('YYYY-MM-DD HH:mm')}`}
                    {filters.startDate && filters.endDate && " "}
                    {filters.endDate && `to ${moment(filters.endDate).format('YYYY-MM-DD HH:mm')}`}
                  </p>
                )}
              </div>
            </div>
            <Spacer y={3} />
            {/* Logs Table */}
            <Table 
            isStriped 
            aria-label="Logs table" 
            className="min-h-[400px]"
            bottomContent={
          <div className="flex w-full justify-center items-center gap-4">
            <Pagination
              isCompact
              showShadow
              color="secondary"
              page={currentPage}
              total={totalPages}
              onChange={handlePageChange}
              showControls
            />

            {/* Direct page navigation */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">
                  Page {currentPage} of {totalPages} | Go to:
                </span>
                <Input
                  type="number"
                  placeholder="Page"
                  value={pageInputValue}
                  onChange={(e) => setPageInputValue(e.target.value)}
                  onKeyPress={handlePageInputKeyPress}
                  className="w-20"
                  size="sm"
                  min={1}
                  max={totalPages}
                />
                <Button
                  size="sm"
                  variant="flat"
                  onClick={handlePageInputSubmit}
                  isDisabled={!pageInputValue || totalPages === 0}
                >
                  Go
                </Button>
              </div>
            )}
          </div>
        }
        bottomContentPlacement="outside"
            >
              <TableHeader>
                {isGrouped ? (
                  <>
                    <TableColumn>
                      {filters.groupBy === "date" ? "DATE" : "KEY"}
                    </TableColumn>
                    <TableColumn>LATEST TIMESTAMP</TableColumn>
                    <TableColumn>RECENT LOGS</TableColumn>
                  </>
                ) : (
                  <>
                    <TableColumn>TIMESTAMP</TableColumn>
                    <TableColumn>LEVEL</TableColumn>
                    <TableColumn>KEY</TableColumn>
                    <TableColumn>MESSAGE</TableColumn>
                    <TableColumn>META</TableColumn>
                  </>
                )}
              </TableHeader>
               
              <TableBody
                items={isGrouped ? groupedLogs : logs}
                isLoading={loading}
                loadingContent={<LoadingModal isOpen={loading}/>}
                emptyContent="No logs found"
              >
                {isGrouped
                  ? (group: GroupedLogEntry) => (
                      <TableRow
                        key={group.key}
                        className="cursor-pointer hover:bg-gray-700"
                        onClick={() => handleGroupClick(group)}
                      >
                        <TableCell className="font-medium">
                          {formatGroupKey(group.key, filters.groupBy)}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {formatTimestamp(group.latest_timestamp)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {group.recent_logs.slice(0, 2).map((log, index) => (
                              <div
                                key={index}
                                className="text-sm text-gray-300 truncate max-w-xs"
                              >
                                <Chip
                                  color={getLevelColor(log.level)}
                                  size="sm"
                                  variant="flat"
                                  className="mr-2"
                                >
                                  {log.level}
                                </Chip>
                                {log.message}
                              </div>
                            ))}
                            {group.recent_logs.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{group.recent_logs.length - 2} more
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  : (log: LogEntry) => (
                      <TableRow
                        key={log._uniqueId}
                        className="cursor-pointer hover:bg-gray-700"
                        onClick={() => handleLogClick(log)}
                      >
                        <TableCell className="text-gray-300">
                          {formatTimestamp(log["@timestamp"])}
                        </TableCell>
                        <TableCell>
                          <Chip
                            color={getLevelColor(log.level)}
                            variant="flat"
                            startContent={getLevelIcon(log.level)}
                          >
                            {log.level.toUpperCase()}
                          </Chip>
                        </TableCell>
                        <TableCell className="text-white">{log.key}</TableCell>
                        <TableCell className="max-w-md truncate text-gray-300">
                          {log.message}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate text-gray-400">
                            {formatMeta(log.meta)}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
              </TableBody>
              
            </Table>
          </div>
        </CardBody>
      </Card>
                    
      {/* Modal for Group Details and Individual Log Details */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 !p-4">
                {selectedGroup ? (
                  <>
                    <h2 className="text-xl font-bold">
                      {formatGroupKey(selectedGroup.key, filters.groupBy)} - Recent Logs
                    </h2>
                    <p className="text-sm text-gray-600">
                      {selectedGroup.count} total logs in this group
                    </p>
                  </>
                ) : selectedLog ? (
                  <>
                    <h2 className="text-xl font-bold">Log Details</h2>
                    <p className="text-sm text-gray-600">
                      {selectedLog.key} - {formatTimestamp(selectedLog["@timestamp"])}
                    </p>
                  </>
                ) : null}
              </ModalHeader>
              <ModalBody className="!p-2">
                {selectedGroup ? (
                  <div className="">
                    {selectedGroup.recent_logs.map((log, index) => (
                        <div
                          key={index}
                          className={`p-2 border-b border-y-zinc-600 last:border-b-0`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium">
                                {formatTimestamp(log["@timestamp"])}
                              </span>
                            </div>
                            <Chip
                              color={getLevelColor(log.level)}
                              variant="flat"
                              startContent={getLevelIcon(log.level)}
                            >
                              {log.level.toUpperCase()}
                            </Chip>
                          </div>

                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{log.key}</span>
                          </div>

                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
                            <span className="text-sm">{log.message}</span>
                          </div>

                          {log.meta && Object.keys(log.meta).length > 0 && (
                            <div className="flex items-start gap-2 flex-wrap">
                              <Database className="w-4 h-4 text-gray-500 mt-0.5" />
                              <pre className="mt-1 text-sm bg-gray-100 p-3 rounded overflow-x-auto whitespace-pre-wrap break-words">
                                {formatMeta(log.meta)}
                              </pre>
                            </div>
                          )}
                        </div>
                    ))}
                  </div>
                ) : selectedLog ? (
                    <div className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">
                            {formatTimestamp(selectedLog["@timestamp"])}
                          </span>
                        </div>
                        <Chip
                          color={getLevelColor(selectedLog.level)}
                          variant="flat"
                          startContent={getLevelIcon(selectedLog.level)}
                        >
                          {selectedLog.level.toUpperCase()}
                        </Chip>
                      </div>

                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Key:</span>
                        <span>{selectedLog.key}</span>
                      </div>

                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div>
                          <span className="font-medium">Message:</span>
                          <p className="mt-1">{selectedLog.message}</p>
                        </div>
                      </div>

                      {selectedLog.meta && Object.keys(selectedLog.meta).length > 0 && (
                        <div className="flex items-start gap-2">
                          <Database className="w-4 h-4 text-gray-500 mt-0.5" />
                          <div className="flex-1">
                            <span className="font-medium">Metadata:</span>
                            <pre className="mt-1 text-sm bg-gray-100 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                              {formatMeta(selectedLog.meta)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
