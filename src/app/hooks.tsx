import useSWR from 'swr';
import { PurchaseObj } from './store/purchaseStore';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Joi from 'joi';
import { getSession } from 'next-auth/react';



export function usePurchasesData(params) {
  const { data, error, isLoading, mutate } = useSWR({
    url: `/purchases`,
    params,
  });

  return {
    data,
    isLoading,
    isError: error,
    mutate,
  };
}

function JoiValidatePurchase(obj: any) {
  const schema = Joi.object({
    email: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: false } })
      .required()
      .trim()
      .messages({
        'string.email': `Email must be valid`,
        'string.required': `Email is required`,
      }),
    number_of_licenses: Joi.number().min(1).max(1000).required().messages({
      'number.required': `Number of Licenses is required`,
      'number.min': `Number of Licenses must be greater than or equal to 1`,
    }),
    duration: Joi.number().min(1).required().messages({
      'number.min': `Duration is required`,
    }),
    is_subscription: Joi.boolean().optional(),
    code: Joi.string().required(),
    order_number: Joi.string().required(),
  });
  // returns the schema and validates whatever obj we put in
  return schema.validate(obj);
}

export function useEditPurchase() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updatePurchase = async (
    purchaseId: number,
    updatedData: Partial<PurchaseObj>
  ) => {
    const reshapedData = {
      email: updatedData.email,
      code: updatedData.confirmationCode,
      duration: updatedData.duration,
      is_subscription: updatedData.isSubscription,
      number_of_licenses: updatedData.numberOfLicenses,
      order_number: updatedData.orderNumber,
    };
    const { error } = JoiValidatePurchase(reshapedData);
    if (error) {
      setErrorMessage(error.details[0].message);
      return;
    } else {
      setErrorMessage(null);
    }
    try {

      const session = await getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }
     
      const response = await axios.patch(
        `${process.env.CLOUDRUN_DEV_URL}/purchases/${purchaseId}`,
        reshapedData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.user?.sessionToken}`,
          },
        }
      );

      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'Failed to update purchase';
        console.error('Error updating purchase:', errorMessage);
        setErrorMessage(errorMessage);
      } else {
        console.error('Error updating purchase:', error);
        setErrorMessage('An unexpected error occurred');
      }
      throw error;
    }
  };

  return { updatePurchase, errorMessage, setErrorMessage };
}

// useAdditionalInfo
interface AdditionalInfo {
  id: number;
  purchase_id: number;
  info: string;
}

export const useAdditionalInfo = (purchaseId: number) => {
  const [additionalInfos, setAdditionalInfos] = useState<AdditionalInfo[]>([]);
  const [editedAdditionalInfos, setEditedAdditionalInfos] =
    useState<Record<any>>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAdditionalInfo = async () => {
    setError(null);
    try {
      const response = await axios.get(
        `${process.env.CLOUDRUN_DEV_URL}/purchases/additional-info/${purchaseId}`
      );
      if (response.status === 200 && Array.isArray(response.data)) {
        setAdditionalInfos(response.data);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // Handle 404 silently, just set empty array
        setAdditionalInfos([]);
      } else {
        console.error('Error fetching additional info:', error);
        setError('Failed to fetch additional info');
      }
    }
  };

  useEffect(() => {
    fetchAdditionalInfo();
  }, [purchaseId]);
  

  const editAdditionalInfo = (id: number, newInfo: string, isHidden?: boolean) => {
    setEditedAdditionalInfos({
      id,
      info: newInfo,
      ...(isHidden !== undefined && { is_hidden: isHidden }),
    });
    setAdditionalInfos((prev) =>
      prev.map((info) =>
        info.id === id
          ? {
              ...info,
              info: newInfo,
              ...(isHidden !== undefined && { is_hidden: isHidden }),
            }
          : info
      )
    );
  };

  const saveAdditionalInfo = async () => {
    try {
      const session = await getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }
      await axios.patch(
        `${process.env.CLOUDRUN_DEV_URL}/purchases/additional-info/${editedAdditionalInfos.id}`,
        {
          info: editedAdditionalInfos.info,
          is_hidden: editedAdditionalInfos.is_hidden,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.user?.sessionToken}`,
          },
        }
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'Failed to update purchase';
        console.error('Error updating purchase:', errorMessage);
        setErrorMessage(errorMessage);
      } else {
        console.error('Error updating purchase:', error);
        setErrorMessage('An unexpected error occurred');
      }
      throw error;
    }
  };

  return {
    additionalInfos,
    error,
    setEditedAdditionalInfos,
    editedAdditionalInfos,
    editAdditionalInfo,
    saveAdditionalInfo,
    refetchAdditionalInfo: fetchAdditionalInfo,
  };
};

