
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WagePayment } from '@/pages/Index';

interface WageStore {
  wagePayments: WagePayment[];
  addWagePayment: (payment: Omit<WagePayment, 'id'>) => void;
  removeWagePayment: (id: string) => void;
  getEmployeeWagePayments: (employeeId: string) => WagePayment[];
}

export const useWageStore = create<WageStore>()(
  persist(
    (set, get) => ({
      wagePayments: [],
      addWagePayment: (paymentData) =>
        set((state) => ({
          wagePayments: [
            ...state.wagePayments,
            {
              ...paymentData,
              id: `wage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            },
          ],
        })),
      removeWagePayment: (id) =>
        set((state) => ({
          wagePayments: state.wagePayments.filter((payment) => payment.id !== id),
        })),
      getEmployeeWagePayments: (employeeId) => {
        return get().wagePayments.filter((payment) => payment.employeeId === employeeId);
      },
    }),
    {
      name: 'wage-store',
    }
  )
);
