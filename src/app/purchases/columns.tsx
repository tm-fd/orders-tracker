import { Chip, Link } from "@heroui/react";
import { DeleteIcon, EditIcon, EyeIcon } from '../../components/icons';
import Purchase from '../../components/Purchase';
import Actions from '../../components/Actions';
import { ZPurchase, PurchaseObj } from '../store/purchaseStore';
import { LicensesCell } from '@/components/LicensesCell'; 
import usePurchaseStore from '@/app/store/purchaseStore';




export const columns = [
  {
    key: 'source',
    label: 'Source',
  },
  {
    key: 'orderNumber',
    label: 'Order Number',
  },
  {
    key: 'customerName',
    label: 'Name',
  },
  {
    key: 'confirmationCode',
    label: 'Code',
  },
  {
    key: 'email',
    label: 'Email',
  },
  {
    key: 'date',
    label: 'Created date',
  },
  {
    key: 'numberOfVrGlasses',
    label: 'VR Glasses',
  },
  {
    key: 'numberOfLicenses',
    label: 'Licenses',
  },
  // {
  //   key: 'isSubscription',
  //   label: 'Subscription',
  // },
  {
    key: 'duration',
    label: 'Duration',
  },
  {
    key: 'actions',
    label: 'Actions',
  },
];


const getSource = (purchase: PurchaseObj, oldPurchases: Purchase[] = [], purchaseStatus) => {
  const orderNumberLength = purchase.orderNumber?.toString().length;
  const isContinueTraining = purchase.numberOfVrGlasses === 0 && purchaseStatus?.orderStatus;
  const isStartPackage = purchase.numberOfVrGlasses >= 1 && purchaseStatus?.orderStatus;
  
  if (orderNumberLength > 8) {
    return <span className="italic">Admin</span>;
  }

  if(isContinueTraining || isStartPackage){
    return <span className="text-purple-400 italic">Woo</span>;
  }

  // All other cases are imported orders
   return <span className="italic">Imported</span>;
};

const SourceCell = ({ purchase, oldPurchases }: { 
  purchase: PurchaseObj, 
  oldPurchases: Purchase[] 
}) => {
  const { purchaseStatuses } = usePurchaseStore();
  const purchaseStatus = purchaseStatuses[purchase.id];
  

  return <Purchase>{getSource(purchase, oldPurchases, purchaseStatus)}</Purchase>;
};

export const renderCell = (purchase: PurchaseObj, columnKey: React.Key, oldPurchases?: Purchase[] = []) => {
  const cellValue = purchase[columnKey as keyof PurchaseObj];
  switch (columnKey) {
    case'source':
      return <SourceCell purchase={purchase} oldPurchases={oldPurchases} />;
    case 'orderNumber':
      return <Purchase>{purchase.orderNumber}</Purchase>;
    case 'email':
      return <Purchase>{purchase.email}</Purchase>;
    case 'name':
      return <Purchase>{purchase.customerName}</Purchase>;
    case 'date':
      return <Purchase>{purchase.date.replace('T', ' ').slice(0, 16)}</Purchase>
    case 'updatedDate':
      return <Purchase>{purchase.updatedDate.replace('T', ' ').slice(0, 16)}</Purchase>
    case 'confirmationCode':
      return <Purchase>{purchase.confirmationCode}</Purchase>;
    case 'numberOfVrGlasses':
      return <Purchase>{purchase.numberOfVrGlasses}</Purchase>;
    case 'numberOfLicenses':
      return <LicensesCell purchase={purchase} />;
    case 'isSubscription':
      return <Purchase>{purchase.isSubscription ? 'Yes' : 'No'}</Purchase>;
    case 'duration':
      return <Purchase>{purchase.duration}</Purchase>;
      case "actions":
        return (
          <Actions purchase={purchase} oldPurchases={oldPurchases}/>
        );

    default:
      return cellValue;
  }
};
