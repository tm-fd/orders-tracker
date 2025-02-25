import { PurchaseObj } from '../app/store/purchaseStore';
import { LoadingBars } from '@/components/icons';

export type PurchaseSource = 'Admin' | 'Woo' | 'Imported';

export const getSource = (
  purchase: PurchaseObj, 
  purchaseStatus?: any
): PurchaseSource => {
  const orderNumberLength = purchase.orderNumber?.toString().length;
  const isContinueTraining = purchase.numberOfVrGlasses === 0 && purchaseStatus?.orderStatus;
  const isStartPackage = purchase.numberOfVrGlasses >= 1 && purchaseStatus?.orderStatus;

  if (orderNumberLength > 8) {
    return 'Admin';
  }

  if (isContinueTraining || isStartPackage) {
    return 'Woo';
  }

  return 'Imported';
};