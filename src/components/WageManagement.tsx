
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Calculator, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { UserProfile, Employee, AttendanceRecord, WagePayment } from '@/pages/Index';

interface WageManagementProps {
  user: UserProfile;
}

const WageManagement = ({ user }: WageManagementProps) => {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [wagePayments, setWagePayments] = useState<WagePayment[]>([]);
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchEmployees(),
        fetchAttendanceRecords(),
        fetchWagePayments()
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    let query = supabase.from('employees').select('*');
    
    if (user.role === 'supervisor' && user.site_location) {
      query = query.eq('site_location', user.site_location);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    setEmployees(data || []);
  };

  const fetchAttendanceRecords = async () => {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*');
    
    if (error) throw error;
    
    // Type assertion to ensure attendance_type matches our interface
    const typedData = (data || []).map(record => ({
      ...record,
      attendance_type: record.attendance_type as 'full' | 'half' | '1.5'
    }));
    
    setAttendanceRecords(typedData);
  };

  const fetchWagePayments = async () => {
    const { data, error } = await supabase
      .from('wage_payments')
      .select('*');
    
    if (error) throw error;
    setWagePayments(data || []);
  };

  const calculateWages = (employeeId: string, startDate: string, endDate: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return { totalWage: 0, daysWorked: 0, breakdown: [] };

    const employeeAttendance = attendanceRecords.filter(
      record => 
        record.employee_id === employeeId &&
        record.date >= startDate &&
        record.date <= endDate
    );

    let totalWage = 0;
    const breakdown = employeeAttendance.map(record => {
      let dayWage = 0;
      switch (record.attendance_type) {
        case 'full':
          dayWage = employee.daily_wage;
          break;
        case 'half':
          dayWage = employee.daily_wage * 0.5;
          break;
        case '1.5':
          dayWage = employee.daily_wage * 1.5;
          break;
      }
      totalWage += dayWage;
      return { date: record.date, type: record.attendance_type, wage: dayWage };
    });

    return { totalWage, daysWorked: employeeAttendance.length, breakdown };
  };

  const getEmployeeAdvances = (employeeId: string) => {
    return wagePayments
      .filter(payment => payment.employee_id === employeeId)
      .reduce((total, payment) => total + payment.advance_amount, 0);
  };

  const handleAdvancePayment = async () => {
    if (!selectedEmployee || !advanceAmount) {
      toast({
        title: "Error",
        description: "Please select an employee and enter advance amount.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('wage_payments')
        .insert({
          employee_id: selectedEmployee,
          advance_amount: parseFloat(advanceAmount),
          date: new Date().toISOString().split('T')[0],
          paid_by: user.id,
        });

      if (error) throw error;

      await fetchWagePayments();
      setSelectedEmployee('');
      setAdvanceAmount('');
      toast({
        title: "Success",
        description: "Advance payment recorded successfully!",
      });
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getWageCalculations = () => {
    if (!startDate || !endDate) return [];

    return employees.map(employee => {
      const wageData = calculateWages(employee.id, startDate, endDate);
      const advances = getEmployeeAdvances(employee.id);
      const remaining = wageData.totalWage - advances;

      return {
        employee,
        ...wageData,
        advances,
        remaining,
      };
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Wage Management</h2>
        <p className="text-gray-600">Calculate wages and manage advance payments</p>
      </div>

      {/* Advance Payment Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Record Advance Payment
          </CardTitle>
          <CardDescription>
            Record advance payments given to employees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
              <label className="text-sm font-medium">Advance Amount (₹)</label>
              <Input
                type="number"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={handleAdvancePayment}
                className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600"
              >
                Record Payment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wage Calculation Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Wage Calculator
          </CardTitle>
          <CardDescription>
            Calculate wages for a specific period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {startDate && endDate && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Days Worked</TableHead>
                    <TableHead>Total Wage</TableHead>
                    <TableHead>Advances</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getWageCalculations().map(({ employee, totalWage, daysWorked, advances, remaining }) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.employee_id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{daysWorked} days</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ₹{totalWage.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ₹{advances.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ₹{remaining.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={remaining > 0 ? "default" : remaining < 0 ? "destructive" : "secondary"}
                        >
                          {remaining > 0 ? "Pending" : remaining < 0 ? "Overpaid" : "Settled"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {(!startDate || !endDate) && (
            <div className="text-center py-8 text-gray-500">
              <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Select start and end dates to calculate wages.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WageManagement;
