
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import LoginForm from '@/components/LoginForm';
import Dashboard from '@/components/Dashboard';

export type UserRole = 'admin' | 'supervisor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  siteLocation?: string;
}

export interface Employee {
  id: string;
  name: string;
  employeeId: string;
  jobCategory: string;
  dailyWage: number;
  siteLocation: string;
  addedBy: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  attendanceType: 'full' | 'half' | '1.5';
  markedBy: string;
  createdAt: string;
}

export interface WagePayment {
  id: string;
  employeeId: string;
  advanceAmount: number;
  date: string;
  paidBy: string;
}

const Index = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { toast } = useToast();

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    toast({
      title: "Login Successful",
      description: `Welcome back, ${user.name}!`,
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {!currentUser ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <Dashboard user={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default Index;
