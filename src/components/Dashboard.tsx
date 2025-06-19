
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LogOut, Users, Calendar, DollarSign, FileSpreadsheet } from 'lucide-react';
import type { User } from '@/pages/Index';
import EmployeeManagement from './EmployeeManagement';
import AttendanceManagement from './AttendanceManagement';
import WageManagement from './WageManagement';
import ReportsAndExports from './ReportsAndExports';
import { useEmployeeStore } from '@/store/employeeStore';
import { useAttendanceStore } from '@/store/attendanceStore';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard = ({ user, onLogout }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState('employees');
  const { employees } = useEmployeeStore();
  const { attendanceRecords } = useAttendanceStore();

  const todayAttendance = attendanceRecords.filter(
    record => record.date === new Date().toISOString().split('T')[0]
  );

  const userEmployees = user.role === 'admin' 
    ? employees 
    : employees.filter(emp => emp.siteLocation === user.siteLocation);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      <header className="bg-white/95 backdrop-blur border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-orange-500 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Construction Manager</h1>
                <p className="text-sm text-gray-600">Welcome back, {user.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="px-3 py-1">
                {user.role === 'admin' ? 'Admin' : 'Supervisor'}
              </Badge>
              {user.siteLocation && (
                <Badge variant="outline" className="px-3 py-1">
                  {user.siteLocation}
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{userEmployees.length}</div>
              <p className="text-xs text-gray-500">
                {user.role === 'admin' ? 'All sites' : user.siteLocation}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Today's Attendance</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{todayAttendance.length}</div>
              <p className="text-xs text-gray-500">
                Marked today
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Sites</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {user.role === 'admin' 
                  ? new Set(employees.map(emp => emp.siteLocation)).size 
                  : 1
                }
              </div>
              <p className="text-xs text-gray-500">
                {user.role === 'admin' ? 'All locations' : 'Your location'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-100/50">
              <TabsTrigger value="employees" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Employees
              </TabsTrigger>
              <TabsTrigger value="attendance" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Attendance
              </TabsTrigger>
              <TabsTrigger value="wages" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Wages
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="employees" className="space-y-4">
              <EmployeeManagement user={user} />
            </TabsContent>

            <TabsContent value="attendance" className="space-y-4">
              <AttendanceManagement user={user} />
            </TabsContent>

            <TabsContent value="wages" className="space-y-4">
              <WageManagement user={user} />
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <ReportsAndExports user={user} />
            </TabsContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
