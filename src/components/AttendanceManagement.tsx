
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { UserProfile, Employee, AttendanceRecord } from '@/pages/Index';

interface AttendanceManagementProps {
  user: UserProfile;
}

const AttendanceManagement = ({ user }: AttendanceManagementProps) => {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [attendanceType, setAttendanceType] = useState<'full' | 'half' | '1.5'>('full');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees();
    fetchAttendanceRecords();
  }, [user]);

  const fetchEmployees = async () => {
    try {
      let query = supabase.from('employees').select('*');
      
      if (user.role === 'supervisor' && user.site_location) {
        query = query.eq('site_location', user.site_location);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employees.",
        variant: "destructive",
      });
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAttendanceRecords(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      setLoading(false);
    }
  };

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

  const handleMarkAttendance = async () => {
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
      record => record.employee_id === selectedEmployee && record.date === selectedDate
    );

    if (existingAttendance) {
      toast({
        title: "Error",
        description: "Attendance already marked for this employee today.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('attendance_records')
        .insert({
          employee_id: selectedEmployee,
          date: selectedDate,
          attendance_type: attendanceType,
          marked_by: user.id,
        });

      if (error) throw error;

      await fetchAttendanceRecords();
      setSelectedEmployee('');
      toast({
        title: "Success",
        description: "Attendance marked successfully!",
      });
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast({
        title: "Error",
        description: "Failed to mark attendance. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getEmployeeName = (employeeId: string) => {
    return employees.find(emp => emp.id === employeeId)?.name || 'Unknown';
  };

  const getEmployeeId = (employeeId: string) => {
    return employees.find(emp => emp.id === employeeId)?.employee_id || 'Unknown';
  };

  const getMarkedByName = (markedBy: string) => {
    // For now, just return "System" - in a real app you'd fetch the user name
    return 'System';
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

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
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} ({employee.employee_id})
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
                    const typeInfo = getAttendanceTypeInfo(record.attendance_type);
                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {getEmployeeName(record.employee_id)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getEmployeeId(record.employee_id)}</Badge>
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
                            {getMarkedByName(record.marked_by)}
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
