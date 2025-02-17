'use client'

import { useCallback, useMemo, useState, useEffect } from 'react'
import {Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Input,
    Pagination,
    SortDescriptor,
    Button,
  } from "@heroui/react";

import { Order, columns, renderCell } from '../woo-orders/columns'
import { SearchIcon } from './icons'

export default function OrderTable({ orders }: { orders: Order[] }) {
    const [filterValue, setFilterValue] = useState('')
    const [selectionBehavior, setSelectionBehavior] = useState('replace');

    const hasSearchFilter = Boolean(filterValue)
   

    const searchOrder = (order: Order, value: string) => {
      const lowerFilterValue = value.toString().toLowerCase()
    
      const searchInObject = (obj: any) => {
        for (const key in obj) {
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            // Recursively search in nested objects
            if (searchInObject(obj[key])) return true
          } else if (Array.isArray(obj[key])) {
            // Search within arrays
            for (const item of obj[key]) {
              if (searchInObject(item)) return true
            }
          } else if (obj[key]?.toString().toLowerCase().includes(lowerFilterValue)) {
            return true
          }
        }
        return false
      }
    
      return searchInObject(order)
    }
    
    const filteredItems = useMemo(() => {
      let filteredOrders = [...orders]
    
      if (hasSearchFilter) {
        filteredOrders = filteredOrders.filter(order =>
          searchOrder(order, filterValue)
        )
      }
    
      return filteredOrders
    }, [orders, filterValue, hasSearchFilter])

   
  
    const rowsPerPage = 20
    const [page, setPage] = useState(1)
    const pages = Math.ceil(filteredItems.length / rowsPerPage)
  
    const items = useMemo(() => {
      const start = (page - 1) * rowsPerPage
      const end = start + rowsPerPage
      return filteredItems.slice(start, end)
    }, [page, filteredItems])
  
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
      column: 'date',
      direction: 'descending'
    })
    
  
    const sortedItems = useMemo(() => {
      return [...items].sort((a: Order, b: Order) => {
        const first = a[sortDescriptor.column as keyof Order] as string
        const second = b[sortDescriptor.column as keyof Order] as string
        const cmp = first < second ? -1 : first > second ? 1 : 0
  
        return sortDescriptor.direction === 'descending' ? -cmp : cmp
      })
    }, [sortDescriptor, items])
  
    const onSearchChange = useCallback((value?: string) => {
      if (value) {
        setFilterValue(value)
        setPage(1)
      } else {
        setFilterValue('')
      }
    }, [])
  
    const onClear = useCallback(() => {
      setFilterValue('')
      setPage(1)
    }, [])
  
    const topContent = useMemo(() => {
      return (
        <div className='flex flex-col gap-4'>
          <div className='flex items-end justify-between gap-3'>
            <Input
              isClearable
              className='w-full sm:max-w-[44%]'
              placeholder='Search by id...'
              startContent={<SearchIcon />}
              value={filterValue}
              onClear={() => onClear()}
              onValueChange={onSearchChange}
            />
          </div>
        </div>
      )
    }, [filterValue, onSearchChange, onClear])
  
    return (
      <div>
      <Table
        aria-label='Orders table'
        topContent={topContent}
        topContentPlacement='outside'
        selectionMode="multiple"
        selectionBehavior='replace'
        bottomContent={
          <div className='flex w-full justify-center'>
            <Button
          size="sm"
          variant="flat"
          color="secondary"
          onPress={() => setPage((prev) => (prev > 1 ? prev - 1 : prev))}
        >
          Previous
        </Button>
            <Pagination
              isCompact
              showShadow
              color='secondary'
              page={page}
              total={pages}
              onChange={page => setPage(page)}
            />
            <div className="flex gap-2">
        
        <Button
          size="sm"
          variant="flat"
          color="secondary"
          onPress={() => setPage((prev) => (prev < 10 ? prev + 1 : prev))}
        >
          Next
        </Button>
      </div>
          </div>
        }
        bottomContentPlacement='outside'
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
        classNames={{
          wrapper: 'min-h-[222px]'
        }}
      >
        <TableHeader columns={columns}>
          {column => (
            <TableColumn
              key={column.key}
              {...(column.key === 'date' ? { allowsSorting: true } : {})}
            >
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={sortedItems} emptyContent={'No orders to display.'}>
          {order => (
            <TableRow key={order.id}>
              {columnKey => <TableCell>{renderCell(order, columnKey)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
    )
  }