'use client';
import { useState, useMemo } from 'react';
import {
  Link,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Input,
  Selection,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@heroui/react";
import { SearchIcon } from '../icons';
import { ChevronDownIcon } from '../icons';
import usePurchaseStore from '@/store/purchaseStore';
import moment from 'moment';

interface FirestoreTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

export default function ActivationRecords({
  purchaseId,
}: {
  purchaseId: number;
}) {
  const { purchaseStatuses } = usePurchaseStore();
  const purchaseStatus = purchaseStatuses[purchaseId];
  const activationRecords = purchaseStatus?.activationRecords || [];
  const [filterValue, setFilterValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<Selection>('all');

  const statusOptions = [
    { name: 'Active', uid: 'active' },
    { name: 'Inactive', uid: 'inactive' },
  ];

  const columns = [
    { name: 'NAME', uid: 'name' },
    { name: 'EMAIL', uid: 'email' },
    { name: 'ACTIVATION DATE', uid: 'activation_date' },
    { name: 'USER ID', uid: 'user_id' },
    { name: 'Training started on', uid: 'training_started_on' },
  ];

  const capitalize = (s: string) => {
    return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
  };

  const checkActiveOrNot = (date) => {
    if (date && checkDateisAfterToday(date)) {
      return 'Active';
    } else {
      return 'Inactive';
    }
  };

  const checkDateisAfterToday = (
    firestoreTimestamp: FirestoreTimestamp
  ): boolean => {
    const inputDate = new Date(firestoreTimestamp._seconds * 1000);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    inputDate.setHours(0, 0, 0, 0);
    return inputDate > today;
  };

  const filteredItems = useMemo(() => {
    let filteredRecords = [...activationRecords];
    if (filterValue) {
      filteredRecords = filteredRecords.filter((record) => {
        const searchValue = filterValue.toLowerCase();
        if (record && record.user) {
          return (
            new Date(record.activation_date)
              .toLocaleDateString()
              .toLowerCase()
              .includes(searchValue) ||
            record.user.uuid.toLowerCase().includes(searchValue) ||
            (record.firestoreData?.FirstName || '')
              .toLowerCase()
              .includes(searchValue) ||
            (record.firestoreData?.Email || '')
              .toLowerCase()
              .includes(searchValue)
          );
        }
      });
    }

    if (
      statusFilter !== 'all' &&
      Array.from(statusFilter).length !== statusOptions.length
    ) {
      filteredRecords = filteredRecords.filter((record) => {
        if (!record?.firestoreData?.ValidTill) return false;

        const status = checkActiveOrNot(record.firestoreData.ValidTill);
        const selectedStatus = Array.from(statusFilter)[0]?.toLowerCase();
        return status.toLowerCase() === selectedStatus;
      });
    }
    return filteredRecords;
  }, [activationRecords, filterValue, statusFilter]);

  const onSearchChange = (value: string) => {
    setFilterValue(value);
  };

  const renderTopContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="Search by activation date, user ID, name, or email..."
            startContent={<SearchIcon className="text-default-300" />}
            value={filterValue}
            onValueChange={onSearchChange}
          />
          <Dropdown>
            <DropdownTrigger className="hidden sm:flex">
              <Button
                endContent={<ChevronDownIcon className="text-small" />}
                variant="flat"
              >
                Status
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              aria-label="Table Columns"
              closeOnSelect={false}
              selectedKeys={statusFilter}
              selectionMode="multiple"
              onSelectionChange={setStatusFilter}
            >
              {statusOptions.map((status) => (
                <DropdownItem key={status.uid} className="capitalize">
                  {capitalize(status.name)}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Total {filteredItems.length} activation records
          </span>
          <span className="text-small text-secondary-500">
            {filteredItems.filter((record) => record.user_id).length} have
            completed registration
          </span>
        </div>
      </div>
    );
  }, [filterValue, statusFilter]);
  

  return (
    <div className="w-full mb-4">
      {activationRecords.length === 0 ? (
        <p className="text-red-500">No activation records found</p>
      ) : (
        <div className="w-full">
          <p className="font-medium mb-2">Activation Details</p>
          <Table
            aria-label="Activation records table"
            isHeaderSticky
            classNames={{
              wrapper: 'min-h-[200px]',
              th: 'bg-gray-50',
              td: 'py-3',
            }}
            topContent={renderTopContent}
            topContentPlacement="outside"
            selectionMode="none"
            bordered
            shadow="sm"
            hoverable
            // loadingState={isLoading ? "loading" : "idle"}
          >
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn
                  key={column.uid}
                  align={column.uid === 'actions' ? 'center' : 'start'}
                >
                  {column.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody
              items={filteredItems}
              emptyContent={'No activation records found'}
            >
              {(record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {record.firestoreData?.FirstName || '-'}
                  </TableCell>
                  <TableCell>{record.firestoreData?.Email || '-'}</TableCell>
                  <TableCell>
                    {new Date(record.activation_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {record.user ? (
                      <Link
                        isExternal
                        color="primary"
                        href={`${process.env.IMVI_USERS_URL}/${record.user?.uuid}`}
                        className="text-xs"
                      >
                        {record.user?.uuid}
                      </Link>
                    ) : (
                      'The activation is not completed'
                    )}
                  </TableCell>
                  <TableCell>
                    {record.user?.training_session_data?.length > 0
                      ? moment(record.user?.training_session_data[0].start_time)
                      .format('DD/MM/YYYY')
                      : '-'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
