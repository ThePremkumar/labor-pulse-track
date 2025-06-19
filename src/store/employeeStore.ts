
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Employee } from '@/pages/Index';

interface EmployeeStore {
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt'>) => void;
  removeEmployee: (id: string) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
}

export const useEmployeeStore = create<EmployeeStore>()(
  persist(
    (set) => ({
      employees: [],
      addEmployee: (employeeData) =>
        set((state) => ({
          employees: [
            ...state.employees,
            {
              ...employeeData,
              id: `emp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      removeEmployee: (id) =>
        set((state) => ({
          employees: state.employees.filter((emp) => emp.id !== id),
        })),
      updateEmployee: (id, updates) =>
        set((state) => ({
          employees: state.employees.map((emp) =>
            emp.id === id ? { ...emp, ...updates } : emp
          ),
        })),
    }),
    {
      name: 'employee-store',
    }
  )
);
