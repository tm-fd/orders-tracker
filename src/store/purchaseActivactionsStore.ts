import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserFirestoreData {
  Email?: string;
  FirstName?: string;
}

interface ActivationRecord {
  id: number;
  purchase_id: number;
  activation_date: string;
  updated_at: string;
  user_id: number;
  user: {
    id: number;
    uuid: string;
    registered_on: string;
    starred: boolean;
    type: string;
    deleted: boolean;
  };
  firestoreData?: UserFirestoreData;
}

interface StoreState {
  activationRecords: ActivationRecord[];
  activationError: string | null;
  isLoadingActivations: boolean;
  fetchActivationRecord: (purchaseId: number) => Promise<void>;
  setActivationRecords: (records: ActivationRecord[]) => void;
  clearActivationRecords: () => void;
}

const fetchUserFirestoreData = async (uuid: string): Promise<UserFirestoreData | null> => {
  try {
    const response = await fetch(`/api/userData/${uuid}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch user data');
    }

    const userData = await response.json();
    return userData as UserFirestoreData;
  } catch (error) {
    console.error(`Error fetching Firestore data for user ${uuid}:`, error);
    return null;
  }
};

export const useActivationStore = create<StoreState>()(
  persist(
    (set, get) => ({
      activationRecords: [],
      activationError: null,
      isLoadingActivations: false,

      fetchActivationRecord: async (purchaseId: number) => {
        console.log(purchaseId)
        set({ isLoadingActivations: true, activationError: null });
        try {
          const res = await fetch(
            `${process.env.CLOUDRUN_DEV_URL}/purchases/activations/${purchaseId}`,
            {
              cache: 'no-store',
            }
          );
          
          if (!res.ok) {
            throw new Error(
              `No activation records found for purchase ID ${purchaseId}`
            );
          }
          
          const response = await res.json();
          
          if (response && Array.isArray(response)) {
            const recordsWithFirestoreData = await Promise.all(
              response.map(async (record) => {
                if (record?.user_id) {
                  const firestoreData = await fetchUserFirestoreData(record.user.uuid);
                  return {
                    ...record,
                    firestoreData
                  };
                }
                return record;
              })
            );
            
            set({ 
              activationRecords: recordsWithFirestoreData,
              isLoadingActivations: false 
            });
          }
        } catch (err: any) {
          set({ 
            activationError: err.message,
            isLoadingActivations: false 
          });
        }
      },

      setActivationRecords: (records) => {
        set({ activationRecords: records });
      },

      clearActivationRecords: () => {
        set({ activationRecords: [], activationError: null });
      },
    }),
    {
      name: 'activation-storage',
      partialize: (state) => ({
        activationRecords: state.activationRecords,
      }),
    }
  )
);