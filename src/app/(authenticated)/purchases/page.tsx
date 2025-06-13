'use client';
import { useEffect, useRef } from 'react';
import PurchaseTable from '@/components/purchases/PurchaseTable';
import { ZPurchase } from '@/store/purchaseStore';
import { Button, Spinner } from "@heroui/react";
import usePurchaseStore from '@/store/purchaseStore';
import { useRouter } from 'next/navigation';
import { usePurchasesData } from '@/app/hooks';
import useSWR from'swr';



export const fetchPurchases = async (page: number) => {
  try {
    const res = await fetch(`${process.env.CLOUDRUN_DEV_URL}/purchases/all-purchases?limit=370&page=${page}`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const response = await res.json();
    const customData = response.purchases.map((obj: ZPurchase) => ({
      id: obj.id,
      orderNumber: obj.order_number,
      email: obj.email,
      customerName: obj.first_name + ' ' + obj.last_name,
      date: obj.created_at,
      updatedDate: obj.updated_at,
      confirmationCode: obj.code,
      numberOfVrGlasses: obj.number_of_vr_glasses,
      numberOfLicenses: obj.number_of_licenses,
      isSubscription: obj.is_subscription,
      duration: obj.duration,
    }));
    const data = {
      purchases: customData.reverse(),
      currentPage: response.currentPage,
      total: response.total,
      totalPages: response.totalPages
    }
    
    return data
  } catch (err: any) {
    console.error(err.message);
  } 
};


export default function Purshases() {
  const router = useRouter();
  const isInitialRender = useRef(true);
  const { purchases, setPurchases, setError, currentPage, setCurrentPage, reset } =
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
