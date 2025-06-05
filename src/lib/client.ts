import ActivationRecords from "@/components/purchases/ActivationRecords";

const createQueryString = (params?: Record<string, string | number>) => {
    if (!params) return '';
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    return `?${searchParams.toString()}`;
  };

export const fetchPurchases = async ({url, params}) => {
    const qp = createQueryString(params);
    try {
      const res = await fetch(`${process.env.CLOUDRUN_DEV_URL}/purchases/all-purchases${qp}`, { cache: 'no-store' });
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
        additionalInfo: obj.additional_info,
        Activations: obj.activations,
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