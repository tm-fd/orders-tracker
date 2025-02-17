import usePurchaseStore from '@/app/store/purchaseStore';
import Purchase from './Purchase';
import { PurchaseObj } from '@/app/store/purchaseStore';
export const LicensesCell = ({ purchase }: { purchase: PurchaseObj }) => {
    const { purchaseStatuses } = usePurchaseStore();
    const purchaseStatus = purchaseStatuses[purchase.id];
    const activationRecords = purchaseStatus?.activationRecords.filter(record => record.user_id !== null) || [];
    const purchasedLicenses = Math.abs(purchase.numberOfLicenses - activationRecords.length);
    return (
      <Purchase>
        {purchase.numberOfLicenses}{' '}
        {purchase.numberOfLicenses > 1 ? <span className="text-gray-500">
          ({purchasedLicenses})
        </span> : ''}
      </Purchase>
    );
  };
  