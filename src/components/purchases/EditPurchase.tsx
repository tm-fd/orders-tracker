// EditPurchase.tsx
import React, { useState } from 'react';
import { Input, Button, Switch } from "@heroui/react";
import { PurchaseObj } from '@/store/purchaseStore';
import { useEditPurchase, useAdditionalInfo } from '@/app/hooks';
import { mutate } from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import usePurchaseStore from '@/store/purchaseStore';


interface EditPurchaseProps {
  purchase: PurchaseObj;
  onClose: () => void;
}

export function EditPurchase({ purchase, onClose }: EditPurchaseProps) {
  const [editedPurchase, setEditedPurchase] = useState(purchase);
  const [loading, setLoading] = useState(false);
  const { updatePurchase, errorMessage, setErrorMessage } = useEditPurchase();
  const updatePurchaseStore = usePurchaseStore((state) => state.updatePurchase);
  const {
    additionalInfos,
    editAdditionalInfo,
    editedAdditionalInfos,
    saveAdditionalInfo,
  } = useAdditionalInfo(purchase.id);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const handleInputChange = (field: keyof PurchaseObj, value: any) => {
    setEditedPurchase((prev) => ({
      ...prev,
      [field]: value,
    }));
  };


  const handleSave = async () => {
    try {
      setLoading(true);
      const updatedPurchase = await updatePurchase(purchase.id, editedPurchase);

      if (additionalInfos.length > 0 && editedAdditionalInfos) {
        await saveAdditionalInfo();
      }

      if (updatedPurchase) {
        const purchaseForStore: PurchaseObj = {
          id: editedPurchase.id,
          orderNumber: editedPurchase.orderNumber,
          email: editedPurchase.email,
          customerName: editedPurchase.customerName, 
          date: editedPurchase.date,
          updatedDate: new Date().toISOString(),
          confirmationCode: editedPurchase.confirmationCode,
          numberOfVrGlasses: editedPurchase.numberOfVrGlasses,
          numberOfLicenses: editedPurchase.numberOfLicenses,
          isSubscription: editedPurchase.isSubscription,
          duration: editedPurchase.duration,
          additionalInfo: [{
            info: additionalInfos.length > 0 ? editedAdditionalInfos : '',
            purchase_source: "ADMIN",
            shipped: additionalInfos.length > 0 && additionalInfos[0]?.shipped || false,
          }],
        };
        updatePurchaseStore(purchaseForStore);
        setErrorMessage('The purchase has been updated successfully');
        setIsSubmitted(true);
        await mutate(
          (key) => typeof key === 'string' && key.startsWith('/purchases'),
          undefined,
          { revalidate: true }
        );
        setTimeout(() => {
          setErrorMessage(null);
          setIsSubmitted(false);
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to update purchase:', error);
      setErrorMessage(`Failed to update purchase: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <AnimatePresence initial={false} mode="wait">
        {errorMessage && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              scale: 0.5,
              transition: { duration: 0.2 },
            }}
          >
            <div
              className={`flex flex-col gap-1 ${
                isSubmitted
                  ? 'bg-green-500 text-green-50'
                  : 'bg-warning-100 text-warning-700'
              }`}
            >
              {errorMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Email"
          value={editedPurchase.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
        />
        <Input
          label="Code"
          value={editedPurchase.confirmationCode}
          onChange={(e) =>
            handleInputChange('confirmationCode', e.target.value)
          }
        />
        <Input
          type="number"
          label="Duration"
          value={editedPurchase.duration.toString()}
          onChange={(e) =>
            handleInputChange('duration', parseInt(e.target.value))
          }
        />
        <Input
          type="number"
          label="Number of Licenses"
          value={editedPurchase.numberOfLicenses.toString()}
          onChange={(e) =>
            handleInputChange('numberOfLicenses', parseInt(e.target.value))
          }
        />
        <Input
          label="Order Number"
          value={editedPurchase.orderNumber}
          onChange={(e) => handleInputChange('orderNumber', e.target.value)}
        />
        {additionalInfos.map((pi, index) => (
          <div key={index} className="flex flex-col gap-4 items-center">
             <Input
          label="Additional info"
          value={pi.info}
          onChange={(e) => editAdditionalInfo(pi.id, e.target.value, pi.is_hidden, pi.shipped)}
        />
            <div className="flex gap-4">
              <Switch
                defaultSelected={pi.is_hidden}
                size="sm"
                color="success"
                onChange={(e) => editAdditionalInfo(pi.id, pi.info, e.target.checked, pi.shipped)}
              >
                {pi.is_hidden ? 'Hidden' : 'Visible'}
              </Switch>
              <Switch
                defaultSelected={pi.shipped}
                size="sm"
                color="primary"
                onChange={(e) => editAdditionalInfo(pi.id, pi.info, pi.is_hidden, e.target.checked)}
              >
                {pi.shipped ? 'Shipped' : 'Not Shipped'}
              </Switch>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button
          color="danger"
          variant="flat"
          onPress={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onPress={handleSave}
          isLoading={loading}
          className="bg-blue-700"
        >
          Save
        </Button>
      </div>
    </div>
  );
}
