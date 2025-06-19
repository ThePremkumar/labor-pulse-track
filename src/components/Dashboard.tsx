
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LogOut, Users, Calendar, DollarSign, FileSpreadsheet, User } from 'lucide-react';
import type { UserProfile } from '@/pages/Index';
import EmployeeManagement from './EmployeeManagement';
import AttendanceManagement from './AttendanceManagement';
import WageManagement from './WageManagement';
import ReportsAndExports from './ReportsAndExports';
import Profile from './Profile';

interface DashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

const Dashboard = ({ user, onLogout }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState('employees');
  const [currentUser, setCurrentUser] = useState<UserProfile>(user);

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
  };

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
                <p className="text-sm text-gray-600">Welcome back, {currentUser.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant={currentUser.role === 'admin' ? 'default' : 'secondary'} className="px-3 py-1">
                {currentUser.role === 'admin' ? 'Admin' : 'Supervisor'}
              </Badge>
              {currentUser.site_location && (
                <Badge variant="outline" className="px-3 py-1">
                  {currentUser.site_location}
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
        {/* Main Content Tabs */}
        <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-gray-100/50">
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
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
            </TabsList>

            <TabsContent value="employees" className="space-y-4">
              <EmployeeManagement user={currentUser} />
            </TabsContent>

            <TabsContent value="attendance" className="space-y-4">
              <AttendanceManagement user={currentUser} />
            </TabsContent>

            <TabsContent value="wages" className="space-y-4">
              <WageManagement user={currentUser} />
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <ReportsAndExports user={currentUser} />
            </TabsContent>

            <TabsContent value="profile" className="space-y-4">
              <Profile user={currentUser} onUpdateUser={handleUpdateUser} />
            </TabsContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
