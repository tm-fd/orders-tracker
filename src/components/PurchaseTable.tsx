import { useCallback, useMemo, useState } from "react";
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
} from "@heroui/react";
import {
  Purchase,
  columns,
  renderCell,
} from "@/app/(authenticated)/purchases/columns";
import { SearchIcon } from "./icons";
import usePurchaseStore from "@/store/purchaseStore";
import { getSource, PurchaseSource } from "@/app/utils";
import AddPurchase from "@/components/AddPurchase";

export default function PurchaseTable() {
  const { purchases, purchaseStatuses, currentPage } = usePurchaseStore();
  const [filterValue, setFilterValue] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [showContinueTraining, setShowContinueTraining] = useState(false);
  const [showMultipleLicenses, setShowMultipleLicenses] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const filterOptions = {
    sources: [
      { value: "Admin", label: "Admin" },
      { value: "Woo", label: "Woo" },
      { value: "Imported", label: "Imported" },
    ],
    filters: [
      { value: "continue_training", label: "Continue Training" },
      { value: "multiple_licenses", label: "Multiple Licenses" },
      { value: "show_hidden", label: "Show Hidden" },
      { value: "unused_activation", label: "Unused Activation Code" },
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

  // const filteredItems = useMemo(() => {
  //   let filteredPurchases = [...groupedPurchases];

  //   // Apply filters based on selected options
  //   if (selectedFilters.size > 0) {
  //     filteredPurchases = filteredPurchases.filter(
  //       ({ recentPurchase, oldPurchases }) => {
  //         return Array.from(selectedFilters).every((filter) => {
  //           switch (filter) {
  //             case "show_hidden":
  //               return recentPurchase.additionalInfo?.some(
  //                 (info) => info.is_hidden
  //               );

  //             case "continue_training":
  //               if (recentPurchase.additionalInfo?.length > 0) {
  //                 return (
  //                   (recentPurchase.additionalInfo[0].purchase_type ===
  //                     "CONTINUE_TRAINING" &&
  //                     oldPurchases?.length > 0) ||
  //                   (recentPurchase.additionalInfo[0].purchase_type ===
  //                     "SUBSCRIPTION" &&
  //                     oldPurchases?.length > 0)
  //                 );
  //               }
  //               return false;

  //             case "multiple_licenses":
  //               return recentPurchase.numberOfLicenses > 1;

  //             case "unused_activation":
  //               const status = purchaseStatuses[recentPurchase.id];
  //               return !status?.activationRecords?.length;

  //             default:
  //               return true;
  //           }
  //         });
  //       }
  //     );
  //   }

  //   // Apply source filter
  //   if (sourceFilter !== "all") {
  //     filteredPurchases = filteredPurchases.filter(({ recentPurchase }) => {
  //       return getSource(recentPurchase) === sourceFilter;
  //     });
  //   }

  //   // Apply search filter
  //   if (hasSearchFilter) {
  //     filteredPurchases = filteredPurchases.filter(({ recentPurchase }) =>
  //       searchPurchase(recentPurchase, filterValue)
  //     );
  //   }

  //   return filteredPurchases;
  // }, [
  //   groupedPurchases,
  //   filterValue,
  //   hasSearchFilter,
  //   sourceFilter,
  //   selectedFilters,
  //   purchaseStatuses,
  // ]);

  const filteredItems = useMemo(() => {
    let filteredPurchases = [...groupedPurchases];

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
                  return !recentPurchase?.Activations?.some(activation => activation.user);

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
      filteredPurchases = filteredPurchases.filter(({ recentPurchase }) =>
        searchPurchase(recentPurchase, filterValue)
      );
    }

    return filteredPurchases;
  }, [
    groupedPurchases,
    filterValue,
    hasSearchFilter,
    selectedFilters,
    purchaseStatuses,
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

  //   return (
  //     <div className="flex flex-col gap-4">
  //       <div className="flex items-end justify-between gap-3">
  //         <div className="flex gap-3 flex-1">
  //           <Input
  //             isClearable
  //             className="w-full sm:max-w-[44%]"
  //             placeholder="Search by anything..."
  //             startContent={<SearchIcon />}
  //             value={filterValue}
  //             onClear={() => onClear()}
  //             onValueChange={onSearchChange}
  //           />
  //           <select
  //             className="px-3 py-2 rounded-md border border-gray-300"
  //             value={sourceFilter}
  //             onChange={(e) =>
  //               setSourceFilter(e.target.value as PurchaseSource | "all")
  //             }
  //           >
  //             <option value="all">All Sources</option>
  //             <option value="Admin">Admin</option>
  //             <option value="Woo">Woo</option>
  //             <option value="Imported">Imported</option>
  //           </select>
  //         </div>
  //         <div className="flex gap-3">
  //           <Checkbox
  //             isSelected={showContinueTraining}
  //             onValueChange={setShowContinueTraining}
  //             color="secondary"
  //           >
  //             Continue Training
  //           </Checkbox>
  //           <Checkbox
  //             isSelected={showMultipleLicenses}
  //             onValueChange={setShowMultipleLicenses}
  //             color="secondary"
  //           >
  //             Multiple Licenses
  //           </Checkbox>
  //           <Checkbox
  //             isSelected={showHidden}
  //             onValueChange={setShowHidden}
  //             color="secondary"
  //           >
  //             Show Hidden
  //           </Checkbox>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }, [
  //   filterValue,
  //   onSearchChange,
  //   onClear,
  //   showHidden,
  //   sourceFilter,
  //   showContinueTraining,
  //   showMultipleLicenses,
  // ]);

  const topContent = useMemo(() => {
  const hasFilters = selectedFilters.size > 0;
  
    return (
      <div className="flex flex-col gap-4">
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
                  onPress={() => setSelectedFilters(new Set())}
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
  }, [filterValue, onSearchChange, onClear, selectedFilters, currentPage]);

  
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
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.key}
              {...(column.key === "date" ? { allowsSorting: true } : {})}
            >
              <div className="flex items-center gap-2">
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
                  {renderCell(
                    item.recentPurchase,
                    columnKey,
                    item.oldPurchases
                  )}
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
