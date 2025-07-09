'use client';
import { useEffect, useRef } from 'react';
import PurchaseTable from '@/components/purchases/PurchaseTable';
import { ZPurchase } from '@/store/purchaseStore';
import { Button, Spinner } from "@heroui/react";
import usePurchaseStore from '@/store/purchaseStore';
import { useRouter } from 'next/navigation';
import { usePurchasesData } from '@/app/hooks';
import useSWR from'swr';



export default function Purshases() {
  const router = useRouter();
  const isInitialRender = useRef(true);
  const { purchases, setPurchases, setError, currentPage, setCurrentPage, reset, activeFilters } =
    usePurchaseStore();
  
  const { data, isLoading, error } = usePurchasesData({
    limit: 370,
    page: currentPage,
    skip: isInitialRender.current,
  });
    //  const { data, error, isLoading } = useSWR('/purchases', page => fetchPurchases({ page: currentPage}));
    
    useEffect(() => {
      router.refresh();
   }, []);

    useEffect(() => {
      if (isInitialRender.current) {
        isInitialRender.current = false;
        return;
      }
  
      if (data) {
        setPurchases(data.purchases);
        if (data.currentPage !== 1) {
          setCurrentPage(data.currentPage - 1);
        }
      }
    }, [setPurchases, isLoading, setError, data, currentPage]);

    // Debug active filters
    useEffect(() => {
      console.log('Active filters in purchases page:', activeFilters);
    }, [activeFilters]);

  

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Purchases</h1>
      <div className=" flex flex-col items-center justify-center max-w-full">
        {isLoading || !data || purchases.length === 0 ? (
          <Spinner
            label="Loading..."
            size="lg"
            color="secondary"
            style={{ height: '50vh' }}
          />
        ) : error ? (
          <p className="text-red-500">Failed to load</p>
        ) : (
           <PurchaseTable />
        )}
      </div>
    </main>
  );
}
