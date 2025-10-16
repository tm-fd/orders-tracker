import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {RangeValue} from "@react-types/shared";
import type {DateValue} from "@react-types/datepicker";

export interface ZPurchase {
  id: number;
  email: string;
  code: string;
  created_at: string;
  duration: number;
  first_name: string;
  is_subscription: boolean;
  last_name: string;
  number_of_licenses: number;
  number_of_vr_glasses: number;
  order_number: string;
  updated_at: string;
}

export interface PurchaseObj {
  id: number;
  orderNumber: string;
  email: string;
  customerName: string;
  date: string;
  updatedDate: string;
  confirmationCode: string;
  numberOfVrGlasses: number;
  numberOfLicenses: number;
  isSubscription: boolean;
  duration: number;
  additionalInfo?: {
    info?: string;
    purchase_source?: string;
    shipped?: boolean;
    is_hidden?: boolean;
  }[];
}

interface PurchaseStatus {
  orderStatus: any | null;
  orderConfirmationNotification: string | null;
  shippingInfo: any | null;
  activationRecords: any[];
  hasOrderStatus_email: boolean;
  isActivated_VReceived: boolean;
  startedTraining: boolean;
  startedTraining_with_VR:boolean;
  isInvalidAccount: boolean;
  multipleActivations: boolean;
}

interface State {
  purchases: PurchaseObj[];
  purchaseStatuses: Record<number, PurchaseStatus>;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  activeFilters: {
    missingShipping: boolean;
    purchaseIds?: number[];
  };
}

interface Actions {
  setPurchases: (purchases: ZPurchase[]) => void;
  setPurchaseStatus: (purchaseId: number, status: PurchaseStatus) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentPage: (page: number) => void;
  addPurchase: (purchase: ZPurchase) => void;
  updatePurchase: (updatedPurchase: PurchaseObj) => void;
  fetchPurchaseStatusesByDateRange: (startDate: Date, endDate: Date) => Promise<void>;
  setActiveFilters: (filters: { missingShipping?: boolean; purchaseIds?: number[] }) => void;
  clearActiveFilters: () => void;
  reset: () => void;
  hasCachedData: () => boolean;
  refreshPurchases: () => void;
}

const initialState: State = {
  purchases: [],
  purchaseStatuses: {},
  isLoading: false,
  error: null,
  currentPage: 0,
  activeFilters: {
    missingShipping: false,
    purchaseIds: undefined,
  },
};

const usePurchaseStore = create<State & Actions>()(
    (set, get) => ({
      ...initialState,
      setPurchases: (purchases) => set((state) => ({
        purchases: [...state.purchases, ...purchases],
      })),
      setPurchaseStatus: (purchaseId, status) => set((state) => ({
        purchaseStatuses: {
          ...state.purchaseStatuses,
          [purchaseId]: status,
        },
      })),
      setIsLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setCurrentPage: (currentPage) => set({ currentPage }),
      addPurchase: (purchase) => set((state) => ({
        purchases: [purchase, ...state.purchases],
      })),
      updatePurchase: (updatedPurchase) => set((state) => ({
        purchases: state.purchases.map((purchase) =>
          purchase.id === updatedPurchase.id ? updatedPurchase : purchase
        ),
      })),
      fetchPurchaseStatusesByDateRange: async (startDate, endDate) => {
        console.log(startDate.toISOString(), endDate.toISOString())
        try {
          set({ isLoading: true, error: null });
          const response = await fetch(
            `${process.env.CLOUDRUN_DEV_URL}/purchases/all-info-by-date-range?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
          );
          if (!response.ok) {
            throw new Error('Failed to fetch purchase statuses');
          }
  
          const data = await response.json();
          set({ purchaseStatuses: data });
        } catch (error) {
          set({ error: error.message });
        } finally {
          // setTimeout(() => set({ isLoading: false }), 2000);
           set({ isLoading: false });
        }
      },
      setActiveFilters: (filters) => set((state) => ({
        activeFilters: {
          ...state.activeFilters,
          ...filters,
        }
      })),
      
      clearActiveFilters: () => set((state) => ({
        activeFilters: {
          missingShipping: false,
          purchaseIds: undefined,
        }
      })),
      reset: () => set(initialState),
      hasCachedData: () => {
        const state = get();
        return state.purchases.length > 0;
      },
    }),
    {
      name: 'purchase-storage',
      partialize: (state) => ({
        purchases: state.purchases,
        purchaseStatuses: state.purchaseStatuses,
        activeFilters: state.activeFilters,
      }),
    }
);

export default usePurchaseStore;