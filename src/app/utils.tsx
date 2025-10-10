import { PurchaseObj } from '../store/purchaseStore';
import { LoadingBars } from '@/components/icons';

export type PurchaseSource = 'Admin' | 'Shopify' | 'Imported';

export const getSource = (
  purchase: PurchaseObj
): PurchaseSource => {

  if(purchase.additionalInfo.length > 0) {
    if (purchase.additionalInfo[0].purchase_source === "ADMIN") {
      return 'Admin';
    }
  
    if (purchase.additionalInfo[0].purchase_source === "WEBSHOP") {
      return 'Shopify';
    }

    // if (purchase.additionalInfo[0].purchase_source === "IMPORTED") {
    //   return 'Imported';
    // }
  }
  return 'Imported';
  
};