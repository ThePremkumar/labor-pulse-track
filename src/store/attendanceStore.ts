
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AttendanceRecord } from '@/pages/Index';

interface AttendanceStore {
  attendanceRecords: AttendanceRecord[];
  addAttendance: (attendance: Omit<AttendanceRecord, 'id' | 'createdAt'>) => void;
  removeAttendance: (id: string) => void;
  getEmployeeAttendance: (employeeId: string) => AttendanceRecord[];
  getAttendanceByDateRange: (startDate: string, endDate: string) => AttendanceRecord[];
}

export const useAttendanceStore = create<AttendanceStore>()(
  persist(
    (set, get) => ({
      attendanceRecords: [],
      addAttendance: (attendanceData) =>
        set((state) => ({
          attendanceRecords: [
            ...state.attendanceRecords,
            {
              ...attendanceData,
              id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      removeAttendance: (id) =>
        set((state) => ({
          attendanceRecords: state.attendanceRecords.filter((record) => record.id !== id),
        })),
      getEmployeeAttendance: (employeeId) => {
        return get().attendanceRecords.filter((record) => record.employeeId === employeeId);
      },
      getAttendanceByDateRange: (startDate, endDate) => {
        return get().attendanceRecords.filter(
          (record) => record.date >= startDate && record.date <= endDate
        );
      },
    }),
    {
      name: 'attendance-store',
    }
  )
);
