import { Tooltip } from "@heroui/react";
import { CheckCircle2, Circle } from 'lucide-react';
import { PurchaseStatus } from '@/store/purchaseStore'

const steps = [
  { key: 'orderPlaced', label: 'Order Placed' },
  { key: 'orderConfirmed', label: 'Order Confirmed' },
  { key: 'vrShipped', label: 'VR Shipped' },
  { key: 'vrDelivered', label: 'VR Delivered' },
  { key: 'accountActivated', label: 'Account Activated' },
  { key: 'trainingStarted', label: 'Training Started' },
];

export function PurchaseProgressSteps({ purchaseStatus }: PurchaseStatus) {
  const getStepStatus = (step: string) => {
    switch (step) {
      case 'orderPlaced':
        return !!purchaseStatus.orderStatus;
      case 'orderConfirmed':
        return !!purchaseStatus.orderEmail;
      case 'vrShipped':
        return !!purchaseStatus.shippingInfo;
      case 'vrDelivered':
        return (
          purchaseStatus.shippingInfo &&
          (purchaseStatus.shippingInfo.status === 'DELIVERED' ||
            purchaseStatus.shippingInfo.status?.statusCode === 'delivered')
        );
      case 'accountActivated':
        return purchaseStatus.activationRecords.length > 0;
      case 'trainingStarted':
        return purchaseStatus.startedTraining;
      default:
        return false;
    }
  };

  return (
    <div className="w-full px-4 py-2">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          {steps.map(({ label }) => (
            <div key={label} className="text-xs text-gray-600 text-center w-16">
              {label}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center">
          {steps.map(({ key }, index) => (
            <div key={key} className="flex items-center">
              <div className="relative">
                {getStepStatus(key) ? (
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-300" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-[2px] w-full min-w-[50px] ${
                    getStepStatus(key) ? 'bg-primary' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
