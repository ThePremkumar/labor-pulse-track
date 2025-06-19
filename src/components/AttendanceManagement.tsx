
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/pages/Index';
import { useEmployeeStore } from '@/store/employeeStore';
import { useAttendanceStore } from '@/store/attendanceStore';

interface AttendanceManagementProps {
  user: User;
}

const AttendanceManagement = ({ user }: AttendanceManagementProps) => {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [attendanceType, setAttendanceType] = useState<'full' | 'half' | '1.5'>('full');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { employees } = useEmployeeStore();
  const { attendanceRecords, addAttendance } = useAttendanceStore();
  const { toast } = useToast();

  const userEmployees = user.role === 'admin' 
    ? employees 
    : employees.filter(emp => emp.siteLocation === user.siteLocation);

  const todayAttendance = attendanceRecords.filter(
    record => record.date === selectedDate
  );

  const getAttendanceTypeInfo = (type: string) => {
    switch (type) {
      case 'full':
        return { label: 'Full Day', time: '9:00 AM - 5:00 PM', color: 'bg-green-500' };
      case 'half':
        return { label: 'Half Day', time: '1:00 PM - 5:00 PM', color: 'bg-yellow-500' };
      case '1.5':
        return { label: '1.5 Day', time: '8:00 AM - 7:00 PM', color: 'bg-blue-500' };
      default:
        return { label: 'Unknown', time: '', color: 'bg-gray-500' };
    }
  };

  const handleMarkAttendance = () => {
    if (!selectedEmployee) {
      toast({
        title: "Error",
        description: "Please select an employee.",
        variant: "destructive",
      });
      return;
    }

    // Check if attendance already marked for this employee today
    const existingAttendance = attendanceRecords.find(
      record => record.employeeId === selectedEmployee && record.date === selectedDate
    );

    if (existingAttendance) {
      toast({
        title: "Error",
        description: "Attendance already marked for this employee today.",
        variant: "destructive",
      });
      return;
    }

    addAttendance({
      employeeId: selectedEmployee,
      date: selectedDate,
      attendanceType,
      markedBy: user.id,
    });

    setSelectedEmployee('');
    toast({
      title: "Success",
      description: "Attendance marked successfully!",
    });
  };

  const getEmployeeName = (employeeId: string) => {
    return employees.find(emp => emp.id === employeeId)?.name || 'Unknown';
  };

  const getEmployeeId = (employeeId: string) => {
    return employees.find(emp => emp.id === employeeId)?.employeeId || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Attendance Management</h2>
        <p className="text-gray-600">Mark and track daily attendance</p>
      </div>

      {/* Mark Attendance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Mark Attendance
          </CardTitle>
          <CardDescription>
            Mark attendance for employees at your site
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Employee</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {userEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} ({employee.employeeId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Attendance Type</label>
              <Select value={attendanceType} onValueChange={(value: 'full' | 'half' | '1.5') => setAttendanceType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Day (9:00 AM - 5:00 PM)</SelectItem>
                  <SelectItem value="half">Half Day (1:00 PM - 5:00 PM)</SelectItem>
                  <SelectItem value="1.5">1.5 Day (8:00 AM - 7:00 PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={handleMarkAttendance}
                className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600"
              >
                Mark Attendance
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Attendance for {new Date(selectedDate).toLocaleDateString()}
          </CardTitle>
          <CardDescription>
            {todayAttendance.length} employees marked present
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayAttendance.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No attendance marked for this date.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Attendance Type</TableHead>
                    <TableHead>Work Hours</TableHead>
                    <TableHead>Marked By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayAttendance.map((record) => {
                    const typeInfo = getAttendanceTypeInfo(record.attendanceType);
                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {getEmployeeName(record.employeeId)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getEmployeeId(record.employeeId)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${typeInfo.color} text-white`}>
                            {typeInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{typeInfo.time}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {employees.find(emp => emp.addedBy === record.markedBy)?.name || 'System'}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceManagement;
