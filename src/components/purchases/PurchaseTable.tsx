import { useCallback, useMemo, useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Pagination,
  SortDescriptor,
  Checkbox,
  Tooltip,
  Select,
  SelectItem,
  Chip,
  SelectedItems,
  SelectSection,
  Button,
  useDisclosure,
} from "@heroui/react";
import {
  Purchase,
  columns,
  renderCell,
} from "@/app/(authenticated)/purchases/columns";
import { SearchIcon } from "../icons";
import usePurchaseStore from "@/store/purchaseStore";
import { getSource, PurchaseSource } from "@/app/utils";
import AddPurchase from "@/components/purchases/AddPurchase";
import CreateTodoModal from "@/components/purchases/CreateTodoModal";
import { Plus } from "lucide-react";
import moment from "moment";

export default function PurchaseTable() {
  const {
    purchases,
    purchaseStatuses,
    currentPage,
    activeFilters,
    clearActiveFilters,
  } = usePurchaseStore();
  const [filterValue, setFilterValue] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [showContinueTraining, setShowContinueTraining] = useState(false);
  const [showMultipleLicenses, setShowMultipleLicenses] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [selectedPurchaseIds, setSelectedPurchaseIds] = useState<Set<number>>(new Set());
  const { isOpen: isTodoModalOpen, onOpen: onTodoModalOpen, onOpenChange: onTodoModalOpenChange } = useDisclosure();

  // Check if missing shipping filter is selected
  const isMissingShippingSelected = selectedFilters.includes("missing_shipping");

  const filterOptions = {
    sources: [
      { value: "Admin", label: "Admin" },
      { value: "Shopify", label: "Shopify" },
      { value: "Imported", label: "Imported" },
    ],
    filters: [
      { value: "continue_training", label: "Continue Training" },
      { value: "multiple_licenses", label: "Multiple Licenses" },
      { value: "show_hidden", label: "Show Hidden" },
      { value: "unused_activation", label: "Unused Activation Code" },
      { value: "active_not_trained", label: "Active not trained" },
      { value: "missing_shipping", label: "Missing Shipping" },
    ],
  };

  const hasSearchFilter = Boolean(filterValue);

  const searchPurchase = (purchase: Purchase, value: string) => {
    const lowerFilterValue = value.toString().toLowerCase();

    const searchInObject = (obj: any) => {
      for (const key in obj) {
        if (typeof obj[key] === "object" && obj[key] !== null) {
          if (searchInObject(obj[key])) return true;
        } else if (Array.isArray(obj[key])) {
          for (const item of obj[key]) {
            if (searchInObject(item)) return true;
          }
        } else if (
          obj[key]?.toString().toLowerCase().includes(lowerFilterValue)
        ) {
          return true;
        }
      }
      return false;
    };
    return searchInObject(purchase);
  };

  const groupedPurchases = useMemo(() => {
    // Group purchases by email
    const grouped = purchases.reduce((acc, purchase) => {
      const email = purchase.email.toLowerCase(); // normalize email
      if (!acc[email]) {
        acc[email] = [];
      }
      acc[email].push(purchase);
      return acc;
    }, {} as Record<string, Purchase[]>);

    // For each group, find the most recent purchase and collect old purchases
    return Object.entries(grouped).map(([email, group]) => {
      // Sort purchases by date in descending order
      const sortedPurchases = [...group].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Get the most recent purchase
      const recentPurchase = sortedPurchases[0];

      // Get all other purchases as old purchases
      const oldPurchases = sortedPurchases.slice(1);

      return { recentPurchase, oldPurchases };
    });
  }, [purchases]);

  const checkActiveNotTrainedUsers = (purchase) => {
    if (!purchase.Activations?.length) return false;

    const activatedNotTrained = purchase.Activations?.some((record) => {
      if (!record.user) return false;

      if (!record.user?.training_session_data?.length) return true;
    });

    return activatedNotTrained;
  };

  const filteredItems = useMemo(() => {
    let filteredPurchases = [...groupedPurchases];

    if (activeFilters.purchaseIds && activeFilters.purchaseIds.length > 0) {
      if (activeFilters.missingShipping) {
        // Filter only the purchases that are in the purchaseIds array
        filteredPurchases = filteredPurchases.filter(
          ({ recentPurchase, oldPurchases }) =>
            activeFilters.purchaseIds.includes(recentPurchase.id) ||
            oldPurchases.some((oldPurchase) =>
              activeFilters.purchaseIds.includes(oldPurchase.id)
            )
        );
      } else {
        // For other notification types, just filter by purchase IDs
        filteredPurchases = filteredPurchases.filter(({ recentPurchase }) =>
          activeFilters.purchaseIds.includes(recentPurchase.id)
        );
      }
    }

    if (selectedFilters.size > 0) {
      // Separate source filters and regular filters
      const selectedSourceFilters = Array.from(selectedFilters).filter(
        (filter) => filterOptions.sources.some((s) => s.value === filter)
      );
      const selectedRegularFilters = Array.from(selectedFilters).filter(
        (filter) => filterOptions.filters.some((f) => f.value === filter)
      );

      filteredPurchases = filteredPurchases.filter(
        ({ recentPurchase, oldPurchases }) => {
          // Handle source filters
          const passesSourceFilter =
            selectedSourceFilters.length === 0 ||
            selectedSourceFilters.some(
              (filter) => getSource(recentPurchase) === filter
            );

          // Handle regular filters
          const passesRegularFilters = selectedRegularFilters.every(
            (filter) => {
              switch (filter) {
                case "show_hidden":
                  return recentPurchase.additionalInfo?.some(
                    (info) => info.is_hidden
                  );

                case "continue_training":
                  if (recentPurchase.additionalInfo?.length > 0) {
                    return (
                      (recentPurchase.additionalInfo[0].purchase_type ===
                        "CONTINUE_TRAINING" &&
                        oldPurchases?.length > 0) ||
                      (recentPurchase.additionalInfo[0].purchase_type ===
                        "SUBSCRIPTION" &&
                        oldPurchases?.length > 0)
                    );
                  }
                  return false;

                case "multiple_licenses":
                  return recentPurchase.numberOfLicenses > 1;

                case "unused_activation":
                  return (
                    recentPurchase.numberOfLicenses !==
                    recentPurchase?.Activations?.filter(
                      (activation) => activation.user
                    ).length
                  );

                case "active_not_trained":
                  return checkActiveNotTrainedUsers(recentPurchase);

                case "missing_shipping":
                  // Check if shipping is missing based on purchase status and additionalInfo
                  const status = purchaseStatuses[recentPurchase.id];
                  const hasShippingInfo = status?.shippingInfo;
                  const isShipped = recentPurchase.additionalInfo?.some(info => info.shipped === true);
                  // Consider shipping missing if no shipping info and not marked as shipped
                  return !hasShippingInfo && !isShipped && recentPurchase.numberOfVrGlasses > 0;

                default:
                  return true;
              }
            }
          );

          return passesSourceFilter && passesRegularFilters;
        }
      );
    }
    // Apply search filter
    if (hasSearchFilter) {
      filteredPurchases = filteredPurchases.filter(
        ({ recentPurchase, oldPurchases }) =>
          searchPurchase(recentPurchase, filterValue) ||
          oldPurchases.some((purchase) => searchPurchase(purchase, filterValue))
      );
    }

    return filteredPurchases;
  }, [
    groupedPurchases,
    filterValue,
    hasSearchFilter,
    selectedFilters,
    purchaseStatuses,
    activeFilters,
  ]);

  const rowsPerPage = 20;
  const [page, setPage] = useState(1);
  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredItems.slice(start, end);
  }, [page, filteredItems]);

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "date",
    direction: "descending",
  });

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const first = a.recentPurchase[
        sortDescriptor.column as keyof Purchase
      ] as string;
      const second = b.recentPurchase[
        sortDescriptor.column as keyof Purchase
      ] as string;
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const onSearchChange = useCallback((value?: string) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  }, []);

  const onClear = useCallback(() => {
    setFilterValue("");
    setPage(1);
  }, []);

  // Get filtered purchases for missing shipping selection
  const missingShippingPurchases = useMemo(() => {
    if (!isMissingShippingSelected) return [];
    
    return filteredItems.map(item => item.recentPurchase);
  }, [filteredItems, isMissingShippingSelected]);

  const selectedPurchases = useMemo(() => {
    return missingShippingPurchases.filter(purchase => selectedPurchaseIds.has(purchase.id));
  }, [missingShippingPurchases, selectedPurchaseIds]);

  const handlePurchaseSelection = (purchaseId: number, isSelected: boolean) => {
    console.log('Individual selection:', purchaseId, isSelected); // Debug log
    setSelectedPurchaseIds(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(purchaseId);
      } else {
        newSet.delete(purchaseId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (isSelected: boolean) => {
    console.log('Select all triggered:', isSelected); // Debug log
    if (isSelected) {
      setSelectedPurchaseIds(new Set(missingShippingPurchases.map(p => p.id)));
    } else {
      setSelectedPurchaseIds(new Set());
    }
  };

  const handleCreateTodos = () => {
    onTodoModalOpen();
  };

  const handleTodoCreated = () => {
    setSelectedPurchaseIds(new Set());
  };

  // Auto-select missing shipping filter when coming from notification
  useEffect(() => {
    if (activeFilters.missingShipping && !selectedFilters.includes("missing_shipping")) {
      setSelectedFilters(prev => [...prev, "missing_shipping"]);
    }
  }, [activeFilters.missingShipping]);

  const topContent = useMemo(() => {
    const hasFilters =
      selectedFilters.size > 0 ||
      activeFilters.missingShipping ||
      (activeFilters.purchaseIds != null &&
        activeFilters.purchaseIds.length > 0);

    const hasNotificationFilters =
      activeFilters.missingShipping ||
      (activeFilters.purchaseIds != null &&
        activeFilters.purchaseIds.length > 0);

    return (
      <div className="flex flex-col gap-4">
        {/* Show notification filter indicator */}
        {hasNotificationFilters && (
          <div className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-primary-700">
                Showing purchases from notification
              </span>
              {activeFilters.purchaseIds && (
                <span className="text-xs text-primary-600">
                  ({activeFilters.purchaseIds.length} selected)
                </span>
              )}
            </div>
            <Button
              size="sm"
              variant="light"
              color="primary"
              onPress={clearActiveFilters}
            >
              Clear Filter
            </Button>
          </div>
        )}

        {/* Missing shipping selection controls */}
        {isMissingShippingSelected && missingShippingPurchases.length > 0 && (
          <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <Checkbox
                defaultSelected={selectedPurchaseIds.size === missingShippingPurchases.length && missingShippingPurchases.length > 0}
                isIndeterminate={selectedPurchaseIds.size > 0 && selectedPurchaseIds.size < missingShippingPurchases.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
              >
                <span className="font-medium">Select All Missing Shipments ({missingShippingPurchases.length})</span>
              </Checkbox>
              {selectedPurchaseIds.size > 0 && (
                <Button
                  size="sm"
                  color="primary"
                  className="text-black"
                  startContent={<Plus className="w-4 h-4" />}
                  onPress={handleCreateTodos}
                >
                  Create {selectedPurchaseIds.size} Todo{selectedPurchaseIds.size !== 1 ? 's' : ''}
                </Button>
              )}
            </div>
            <p className="text-sm text-warning-700">
              Select purchases to create todos for missing shipments. This will help track and follow up on unshipped orders.
            </p>
          </div>
        )}
        <div className="flex flex-row items-end gap-3">
          <div className="flex w-1/3">
            <Input
              size="lg"
              isClearable
              className="w-full sm:max-w-[90%]"
              placeholder="Search by anything..."
              startContent={<SearchIcon />}
              value={filterValue}
              onClear={() => onClear()}
              onValueChange={onSearchChange}
            />
          </div>
          <div className="flex flex-row items-end gap-2 w-3/4">
            <div className="flex flex-row items-center gap-2 w-full">
              <Select
                isMultiline={true}
                aria-label={"filterBy"}
                placeholder="Filter by"
                selectedKeys={selectedFilters}
                onSelectionChange={setSelectedFilters}
                classNames={{
                  base: "w-full",
                  trigger: "min-h-12 py-2",
                }}
                renderValue={(items) => (
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => {
                      const sourceOption = filterOptions.sources.find(
                        (opt) => opt.value === item.key
                      );
                      const filterOption = filterOptions.filters.find(
                        (opt) => opt.value === item.key
                      );
                      const label = sourceOption?.label || filterOption?.label;
                      return (
                        <Chip key={item.key} color="secondary">
                          {label}
                        </Chip>
                      );
                    })}
                  </div>
                )}
                selectionMode="multiple"
              >
                <SelectSection title="Sources" showDivider>
                  {filterOptions.sources.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectSection>
                <SelectSection title="Filters">
                  {filterOptions.filters.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectSection>
              </Select>

              <Button
                size="lg"
                variant="light"
                color="default"
                isDisabled={!hasFilters}
                onPress={() => [
                  setSelectedFilters(new Set()),
                  clearActiveFilters(),
                ]}
                className="min-w-[120px]"
              >
                Clear Filters
              </Button>
            </div>
            <div className="flex items-end justify-end">
              <AddPurchase currentPage={currentPage} />
            </div>
          </div>
        </div>
      </div>
    );
  }, [
    filterValue,
    onSearchChange,
    onClear,
    selectedFilters,
    currentPage,
    activeFilters,
    clearActiveFilters,
    missingShippingPurchases,
    selectedPurchaseIds,
    handleSelectAll,
    handleCreateTodos,
  ]);

  const handlePaginationChange = (page) => {
    setPage(page);
  };

  return (
    <div className="flex w-full">
      <Table
        isStriped
        aria-label="Purchase table"
        className="min-w-[1024px]"
        topContent={topContent}
        topContentPlacement="outside"
        bottomContent={
          <div className="flex w-full justify-center">
            <Pagination
              isCompact
              showShadow
              color="secondary"
              page={page}
              total={pages}
              onChange={handlePaginationChange}
              showControls
            />
            <div className="flex gap-2"></div>
          </div>
        }
        bottomContentPlacement="outside"
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
        classNames={{
          wrapper: "min-h-[222px]",
        }}
      >
        <TableHeader columns={isMissingShippingSelected ? [{ key: "select", label: "" }, ...columns] : columns}>
          {(column) => (
            <TableColumn
              key={column.key}
              {...(column.key === "date" ? { allowsSorting: true } : {})}
              className={column.key === "date" ? "flex justify-start items-center" : ""}
            >
              <div
                className={`flex items-center 
                  ${column.key === "actions" ? "justify-end" : "justify-start"}
                  gap-2`}
              >
                {column.label}
                {column.key === "actions" && (
                  <Tooltip
                    content={
                      <div className="px-1 py-2">
                        <div className="text-tiny">
                          <p>
                            <span className="inline-block w-3 h-3 rounded-full bg-yallow-500 mr-2"></span>
                            Activation code is sent / Is activated & VR not
                            delivered
                          </p>
                          <p>
                            <span className="inline-block w-3 h-3 rounded-full bg-pink-500 mr-2"></span>
                            Is activated & VR delivered
                          </p>
                          <p>
                            <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                            Started training
                          </p>
                          <p>
                            <span className="inline-block w-3 h-3 rounded-full bg-zinc-300 mr-2"></span>
                            Inactive
                          </p>
                          <p>
                            <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                            All other cases
                          </p>
                        </div>
                      </div>
                    }
                    placement="right"
                  >
                    <div className="cursor-help text-default-400 text-small">
                      ⓘ
                    </div>
                  </Tooltip>
                )}
              </div>
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          items={sortedItems}
          emptyContent={"No purchases to display."}
        >
          {(item) => (
            <TableRow key={item.recentPurchase.id}>
              {(columnKey) => (
                <TableCell>
                  {columnKey === "select" && isMissingShippingSelected ? (
                    <Checkbox
                      defaultSelected={selectedPurchaseIds.has(item.recentPurchase.id)}
                      onChange={(e) => handlePurchaseSelection(item.recentPurchase.id, e.target.checked)}
                    />
                  ) : (
                    renderCell(
                      item.recentPurchase,
                      columnKey,
                      item.oldPurchases
                    )
                  )}
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      <CreateTodoModal
        isOpen={isTodoModalOpen}
        onClose={() => onTodoModalOpenChange(false)}
        selectedPurchases={selectedPurchases}
        onSuccess={handleTodoCreated}
      />
    </div>
  );
}
