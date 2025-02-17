import React from 'react'
import UserPurchaseDetails from './UserPurchaseDetails';
import { PurchaseObj } from '../app/store/purchaseStore';

export default function Actions({ purchase, oldPurchases }: { purchase: PurchaseObj, oldPurchases: PurchaseObj[] }) {
  return <UserPurchaseDetails purchase={purchase} oldPurchases={oldPurchases} />
}