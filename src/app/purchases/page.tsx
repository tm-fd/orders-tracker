'use client';
import { useEffect, useRef } from 'react';
import PurchaseTable from '../../components/PurchaseTable';
import { ZPurchase } from '../store/purchaseStore';
import { Button, Spinner } from "@heroui/react";
import AddPurchase from '../../components/AddPurchase';
import usePurchaseStore from '../store/purchaseStore';
import { useRouter } from 'next/navigation';
import { usePurchasesData } from '../hooks';
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
    <section className="py-24">
      <div className="container flex flex-col items-center justify-center">
        <div className="flex items-center justify-between w-full mb-6">
        <Button onPress={() => router.push('/dashboard')} className="bg-blue-700">Dashboard</Button>
          <AddPurchase currentPage={currentPage} />
        </div>
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
    </section>
  );
}
