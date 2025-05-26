'use client';
import { useState, useEffect, use } from 'react';
import { useDisclosure, Tooltip } from "@heroui/react";
import { EditIcon, EyeIconLoading, LoadingBars } from './icons';
import { SharedModal } from './SharedModal';
import { EditPurchase } from './EditPurchase';
import OrderDetails from './OrderDetails';
import usePurchaseStore, { PurchaseObj } from '@/store/purchaseStore';
import axios from 'axios';
import moment from 'moment';
import { SquareStack, Activity } from 'lucide-react';
import { PurchaseProgressSteps } from './PurchaseProgressSteps';
import { TrainingSessions } from './TrainingSessions';




interface UserPurchaseDetailsProps {
  purchase: PurchaseObj;
  oldPurchases?: PurchaseObj[];
}

export default function UserPurchaseDetails({
  purchase,
  oldPurchases,
}: UserPurchaseDetailsProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isEditing, setIsEditing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);
  const [isViewingTrainingSessions, setIsViewingTrainingSessions] = useState(false);


  const {
    purchases,
    purchaseStatuses,
    setPurchaseStatus,
    setError,
    error,
    isLoading,
    setIsLoading,
  } = usePurchaseStore();
  const purchaseStatus = purchaseStatuses[Number(purchase.id)];
  
  const fetchActivationRecord = async (purchaseId: number) => {
    try {
      const res = await fetch(
        `${process.env.CLOUDRUN_DEV_URL}/purchases/activations/${purchaseId}`,
        {
          cache: 'no-store',
        }
      );

      if (res.status === 404) {
        // Return empty array for no activations instead of throwing error
        return [];
      }

      if (!res.ok) {
        throw new Error(
          `No activation records found for purchase ID ${purchaseId}`
        );
      }

      const response = await res.json();
      if(purchaseId == 1607){
        console.log('Activation records:', response);
      }
      if (response && Array.isArray(response)) {
        return response;
      }
      return [];
    } catch (err) {
      if (err instanceof Error && err.message.includes('404')) {
        return [];
      }
      console.error('Unexpected error fetching activation records:', err);
      setError(err);
      return [];
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      // If we already have the data, don't fetch again
      if (purchaseStatus) {
        setLocalLoading(false);
        return;
      }

      setLocalLoading(true);
      setError(null);
      try {
        // Fetch order status
        let orderStatus = null;
        try {
          const orderStatusRes = await fetch(
            `${process.env.CLOUDRUN_DEV_URL}/purchases/order-status/${purchase.orderNumber}`,
            { cache: 'no-store' }
          );
          if (orderStatusRes.status === 404) {
            // Handle missing order status silently
            orderStatus = null;
          } else if (orderStatusRes.ok) {
            orderStatus = await orderStatusRes.json();
          } else {
            throw new Error(
              `Failed to fetch order status: ${orderStatusRes.statusText}`
            );
          }
        } catch (orderStatusError) {
          if (!orderStatusError.message.includes('404')) {
            console.error('Unexpected order status error:', orderStatusError);
          }
        }
        // Fetch order email
        let orderEmail = null;
        try {
          const emailRes = await fetch('/api/handleOrdersEmail', {
            cache: 'no-store',
          });
          if (emailRes.ok) {
            const emailData = await emailRes.json();
            const sentEmails = emailData.filter(
              (emailObj) => emailObj.ContactAlt === purchase.email.toLowerCase()
            );
            orderEmail = sentEmails.find(
              (email) =>
                email.Subject === 'Tack för din order från imvi labs!' ||
                email.Subject.includes('förnyelseorder')
            )?.Status;
          }
        } catch (emailError) {
          console.error('Error fetching order email:', emailError);
        }

        let shippingInfo = null;
        try {
          // Fetch shipping info
          const shippingRes = await fetch(
            `${process.env.CLOUDRUN_DEV_URL}/purchases/shipping-info/${purchase.id}`,
            { cache: 'no-store' }
          );

          if (shippingRes.status !== 404) {
            if (shippingRes.ok) {
              const shippingData = await shippingRes.json();

              if (shippingData?.tracking_number) {
                if (shippingData.tracking_number.startsWith('UU')) {
                  try {
                    const pnResponse = await axios.get(
                      'https://api2.postnord.com/rest/shipment/v5/trackandtrace/findByIdentifier.json',
                      {
                        params: {
                          apikey: process.env.PN_API_KEY,
                          id: shippingData.tracking_number,
                          locale: 'en',
                        },
                      }
                    );
                    if (
                      pnResponse.data?.TrackingInformationResponse
                        ?.shipments?.[0]
                    ) {
                      shippingInfo =
                        pnResponse.data.TrackingInformationResponse
                          .shipments[0];
                    }
                  } catch (pnError) {
                    console.error('PostNord API error:', pnError);
                  }
                } else {
                  try {
                    const myHeaders = new Headers();
                    myHeaders.append('DHL-API-Key', process.env.DHL_API_KEY);
                    const dhlRes = await fetch(
                      `https://api-eu.dhl.com/track/shipments?trackingNumber=${shippingData.tracking_number}`,
                      {
                        method: 'GET',
                        headers: myHeaders,
                      }
                    );
                    if (dhlRes.ok) {
                      const dhlData = await dhlRes.json();
                      if (dhlData?.shipments?.[0]) {
                        shippingInfo = dhlData.shipments[0];
                      }
                    }
                  } catch (dhlError) {
                    console.error('DHL API error:', dhlError);
                  }
                }
              }
            }
          }
        } catch (shippingError) {
          if (!shippingError.message.includes('404')) {
            console.error('Unexpected shipping info error:', shippingError);
          }
        }
        const activationRecords = await fetchActivationRecord(purchase.id);
        const validUntil = activationRecords[0]?.user?.valid_until;
        const isInvalidAccount = validUntil && moment(validUntil).isBefore(moment());
        

        const hasOrderStatus_email = Boolean(
          orderStatus &&
            orderEmail &&
            !shippingInfo
        );

        const startedTraining = Boolean(
          activationRecords &&
            activationRecords.length > 0 &&
            activationRecords[0]?.user?.training_session_data?.length > 0 &&
            !isInvalidAccount
        );

        const startedTraining_with_VR = Boolean(
          orderStatus &&
            orderEmail &&
            shippingInfo && (shippingInfo.status === 'DELIVERED' || shippingInfo.status?.statusCode === 'delivered') &&
          activationRecords &&
            activationRecords.length > 0 &&
            activationRecords[0]?.user?.training_session_data?.length > 0 &&
            !isInvalidAccount
        );
        
      
        
        const isActivated_and_VR_delivered_Not_trained = Boolean(
          orderStatus &&
            orderEmail &&
            shippingInfo && (shippingInfo.status === 'DELIVERED' || shippingInfo.status?.statusCode === 'delivered') &&
            activationRecords &&
            activationRecords.length > 0 &&
            activationRecords[0]?.user?.training_session_data?.length === 0 &&
            validUntil === null
        );

        const isActivated_and_VR_not_delivered = Boolean(
          orderStatus &&
            orderEmail &&
            shippingInfo && shippingInfo.status !== 'DELIVERED' &&
            activationRecords &&
            activationRecords.length > 0 &&
            !activationRecords[0]?.user?.training_session_data?.length > 0 &&
            validUntil === null
        );

        

        const multipleActivations = Boolean(
          activationRecords && activationRecords.length > 1
        );

        // Store the results in Zustand
        setPurchaseStatus(Number(purchase.id), {
          orderStatus,
          orderEmail,
          shippingInfo,
          activationRecords,
          isActivated_and_VR_delivered_Not_trained,
          isActivated_and_VR_not_delivered,
          startedTraining,
          startedTraining_with_VR,
          hasOrderStatus_email,
          isInvalidAccount,
          multipleActivations,
        });

        setLocalLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(
          error instanceof Error ? error.message : 'An unknown error occurred'
        );
        setLocalLoading(false);
      }
    };

    fetchAllData();
  }, [
    purchase.id,
    purchase.orderNumber,
    purchase.email,
    purchaseStatus,
    setPurchaseStatus,
  ]);

  const handleTrainingSessionsClick = () => {
    setIsViewingTrainingSessions(true);
    onOpen();
  };

  const handleEditClick = () => {
    setIsEditing(true);
    onOpen();
  };

  const handleViewClick = () => {
    if (!localLoading && purchaseStatus) {
      setIsEditing(false);
      onOpen();
    }
  };

  const handleCloseModal = () => {
    setIsEditing(false);
    setIsViewingTrainingSessions(false);
    onClose();
  };

  return (
    <>
    <Tooltip
      content={
        purchaseStatus ? (
          <PurchaseProgressSteps purchaseStatus={purchaseStatus} />
        ) : (
          <div className="p-2"><LoadingBars/></div>
        )
      }
      placement="left"
      offset={-20}
      showArrow
      delay={500}
      closeDelay={0}
      className="w-[500px]"
    >
       <div className="relative flex items-center justify-end gap-2 min-w-20">
       {purchaseStatus?.activationRecords[0]?.user?.training_session_data?.length > 0 && (
  <span
    onClick={handleTrainingSessionsClick}
    className="text-lg text-default-400 cursor-pointer active:opacity-50"
    title="View Training Sessions"
  >
    <Activity size={20} color="#0062ff" />
  </span>
)}
        {purchase.numberOfVrGlasses === 0 && oldPurchases.length > 0 && (
          <span>C</span>
        )}
        {purchaseStatus?.multipleActivations &&
          purchase.numberOfLicenses > 1 && (
            <SquareStack size={20} color="#999999" strokeWidth={1.5} />
          )}
        <span
          onClick={handleViewClick}
          className={`text-lg text-default-400 ${
            !localLoading && purchaseStatus ? 'cursor-pointer' : 'cursor-wait'
          } active:opacity-50`}
        >
          <EyeIconLoading
            isLoading={localLoading}
            strokeColor={
              purchaseStatus?.startedTraining || purchaseStatus?.startedTraining_with_VR
                ? '#0062ff'
                : purchaseStatus?.hasOrderStatus_email
                ? '#e8cd1e'
                : purchaseStatus?.isActivated_and_VR_not_delivered
                ? '#e8cd1e'
                : purchaseStatus?.isActivated_and_VR_delivered_Not_trained
                ? '#ec4fba'
                : purchaseStatus?.isInvalidAccount
                ? '#bababa'
                : '#eb1717'
            }
          />
        </span>
        <span
          onClick={handleEditClick}
          className="text-lg text-default-400 cursor-pointer active:opacity-50"
        >
          <EditIcon />
        </span>
      </div>
    </Tooltip>
    <SharedModal
  isOpen={isOpen}
  onOpenChange={handleCloseModal}
  title={
    isEditing 
      ? 'Edit Purchase' 
      : isViewingTrainingSessions 
        ? 'Training Sessions' 
        : 'Purchase Details'
  }
>
  {isEditing ? (
    <EditPurchase purchase={purchase} onClose={handleCloseModal} />
  ) : isViewingTrainingSessions ? (
    <TrainingSessions 
      sessions={purchaseStatus?.activationRecords[0]?.user?.training_session_data || []} 
    />
  ) : (
    <OrderDetails 
      purchase={purchase} 
      onStatusComplete={setIsComplete} 
      oldPurchases={oldPurchases} 
    />
  )}
</SharedModal>
    </>
  );
}
