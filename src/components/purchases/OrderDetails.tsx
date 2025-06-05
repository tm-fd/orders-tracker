'use client';
import { useState, useEffect } from 'react';
import { Spinner, Chip, Link, Divider, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";
import { PurchaseObj } from '../../store/purchaseStore';
import ActivationRecords from './ActivationRecords';
import { useActivationStore } from '@/store/purchaseActivactionsStore';
import { useAdditionalInfo } from '@/app/hooks';
import usePurchaseStore from '@/store/purchaseStore';
import { getPNShippingStatusInfo, getDHLShippingStatusInfo } from '@/lib/utils'

interface OrderDetailsProps {
  purchase: PurchaseObj;
  oldPurchases: PurchaseObj[];
}

const emailStatusColorMap = {
  delivered: 'secondary',
  opened: 'primary',
  sent: 'secondary',
  blocked: 'danger',
  queued: 'warning',
  processed: 'warning',
  clicked: 'primary',
};



export default function OrderDetails({ purchase, oldPurchases }: OrderDetailsProps) {
  const { purchaseStatuses } = usePurchaseStore();
  const purchaseStatus = purchaseStatuses[purchase.id];

  const {
    additionalInfos,
    error: additionalInfoError,
  } = useAdditionalInfo(purchase.id);

  const {
    orderStatus,
    orderEmail,
    shippingInfo,
    activationRecords,
    isActivated_and_VR_delivered,
    startedTraining,
    hasOrderStatus_email,
    isInvalidAccount,
    multipleActivations,
  } = purchaseStatus
  
  if (!purchaseStatus) {
    return (
      <Spinner
        label="Loading..."
        size="lg"
        color="secondary"
        style={{ height: '50vh' }}
      />
    );
  }

  return (
    <section className="pb-12">
      <div className="container flex flex-col items-start justify-start">
        {/* Additional Info Section */}
        {additionalInfoError ? (
          <p className="text-red-500 mb-4">{additionalInfoError}</p>
        ) : (
          additionalInfos.length > 0 && additionalInfos[0].info !== '' && (
            <div className="flex flex-col items-start justify-center mb-4">
              <h4 className="text-lg font-semibold mb-2">
                Additional Information:
              </h4>
              {additionalInfos.map((pi) => (
                <p className="text-sm" key={pi.id}>
                  {pi.info}
                </p>
              ))}
            </div>
          )
        )}

        {/* Order Status Section */}
        {orderStatus && (
          <div className="flex flex-col items-center justify-center mb-4">
            <p className="font-medium">Order Status: {orderStatus.status}</p>
          </div>
        )}

        {/* Order Email Section */}
        {orderEmail && (
          <div className="flex flex-col items-center justify-center mb-4">
            <div>
              Confirmation email:{' '}
              <Chip
                className="capitalize"
                color={emailStatusColorMap[orderEmail]}
                size="sm"
                variant="flat"
              >
                {orderEmail === 'sent' ? 'Delivered' : orderEmail}
              </Chip>
            </div>
          </div>
        )}

        {/* Shipping Information Section */}
        {shippingInfo && (
          <div className="flex flex-col items-center justify-center mb-4">
            {/* PostNord Shipping */}
            {shippingInfo.statusText && (
              getPNShippingStatusInfo(shippingInfo.statusText.header).status !== 'Not shippable' && (
                <div>
                  Order Shipping:{' '}
                  <Chip
                    className="capitalize"
                    color={getPNShippingStatusInfo(shippingInfo.statusText.header).color}
                    size="sm"
                    variant="faded"
                  >
                    <Link
                      isExternal
                      color={getPNShippingStatusInfo(shippingInfo.statusText.header).color}
                      href={`https://tracking.postnord.com/en/?id=${shippingInfo.shipmentId}`}
                      className="text-xs"
                    >
                      {getPNShippingStatusInfo(shippingInfo.statusText.header).status}
                    </Link>
                  </Chip>
                </div>
              )
            )}
            {/* DHL Shipping */}
            {shippingInfo.status && (
              getDHLShippingStatusInfo(shippingInfo.status.statusCode).status !== 'Not shippable' && (
                <div>
                  Order Shipping:{' '}
                  <Chip
                    className="capitalize"
                    color={getDHLShippingStatusInfo(shippingInfo.status.statusCode).color}
                    size="sm"
                    variant="faded"
                  >
                    <Link
                      isExternal
                      color={getDHLShippingStatusInfo(shippingInfo.status.statusCode).color}
                      href={`https://www.dhl.com/se-en/home/tracking/tracking-freight.html?submit=1&tracking-id=${shippingInfo.id}`}
                      className="text-xs"
                    >
                      {getDHLShippingStatusInfo(shippingInfo.status.statusCode).status}
                    </Link>
                  </Chip>
                </div>
              )
            )}
          </div>
        )}

        <Divider className="my-4" />
        <ActivationRecords purchaseId={purchase.id} />
        <Divider className="my-4" />
         {/* Previous Purchases Section */}
         {oldPurchases && oldPurchases.length > 0 && (
          <div className="w-full mb-6">
            <h4 className="text-lg font-semibold mb-3">Previous Purchases</h4>
            <Table
              aria-label="Old Purchases Table"
              isStriped
              className="w-full"
            >
              <TableHeader>
              <TableColumn>Order Number</TableColumn>
              <TableColumn>Code</TableColumn>
                <TableColumn>Created Date</TableColumn>
                <TableColumn>VR Glasses</TableColumn>
                <TableColumn>Licenses</TableColumn>
                <TableColumn>Duration</TableColumn>
              </TableHeader>
              <TableBody>
                {oldPurchases.map((oldPurchase, index) => (
                  <TableRow key={index.toString()}>
                    <TableCell>{oldPurchase.orderNumber}</TableCell>
                    <TableCell>{oldPurchase.confirmationCode}</TableCell>
                    <TableCell>{new Date(oldPurchase.date).toLocaleDateString()}</TableCell>
                    <TableCell>{oldPurchase.numberOfVrGlasses}</TableCell>
                    <TableCell>{oldPurchase.numberOfLicenses}</TableCell>
                    <TableCell>{oldPurchase.duration}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </section>
  );
}
