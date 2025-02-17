import OrderTable from '@/components/OrderTable';
import { Order } from './columns';
import AddOrder from '@/app/components/AddOrder';
import {Spinner} from "@heroui/react";





async function getOrders(page: number): Promise<Order[]> {
  const orderResult = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders?ordersPage=${page}`, {
    cache: 'no-store',
  });

  const wooEmailsResult = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/woo-emails`, {
    cache: 'no-store',
  });
 
  const orderData = await orderResult.json();
  const wooEmailsData = await wooEmailsResult.json();
  const customData = orderData.map((obj: Order) => {
    return {
      id: obj.id,
      email: obj.billing.email,
      customerName: obj.billing.first_name + ' ' + obj.billing.last_name,
      date: obj.date_created,
      confirmationCode: obj.meta_data.find(
        (o: { key: string; value: string }) => o.key === '_activation_code'
      )?.value,
      status: obj.status,
      trackingNumber: obj.trackingInfo?.trackingNumber,
      trackingStatus: obj.trackingInfo?.trackingStatus,
      sentEmails: wooEmailsData.filter((emailObj: Order.sentEmails) => emailObj.ContactAlt === obj.billing.email),
    };
  });
  return customData;
}

export default async function Orders() {
  const orders = await getOrders(100);
  
  
  return (
    <section className="py-24">
      <div className="container flex flex-col	">
        {!orders || orders.length === 0 ? <Spinner label="Loading..." color="primary" /> : <OrderTable orders={orders} />}
      </div>
    </section>
  );
}
