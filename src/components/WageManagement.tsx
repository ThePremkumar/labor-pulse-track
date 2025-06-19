
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Calculator, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/pages/Index';
import { useEmployeeStore } from '@/store/employeeStore';
import { useAttendanceStore } from '@/store/attendanceStore';
import { useWageStore } from '@/store/wageStore';

interface WageManagementProps {
  user: User;
}

const WageManagement = ({ user }: WageManagementProps) => {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { employees } = useEmployeeStore();
  const { attendanceRecords } = useAttendanceStore();
  const { wagePayments, addWagePayment } = useWageStore();
  const { toast } = useToast();

  const userEmployees = user.role === 'admin' 
    ? employees 
    : employees.filter(emp => emp.siteLocation === user.siteLocation);

  const calculateWages = (employeeId: string, startDate: string, endDate: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return { totalWage: 0, daysWorked: 0, breakdown: [] };

    const employeeAttendance = attendanceRecords.filter(
      record => 
        record.employeeId === employeeId &&
        record.date >= startDate &&
        record.date <= endDate
    );

    let totalWage = 0;
    const breakdown = employeeAttendance.map(record => {
      let dayWage = 0;
      switch (record.attendanceType) {
        case 'full':
          dayWage = employee.dailyWage;
          break;
        case 'half':
          dayWage = employee.dailyWage * 0.5;
          break;
        case '1.5':
          dayWage = employee.dailyWage * 1.5;
          break;
      }
      totalWage += dayWage;
      return { date: record.date, type: record.attendanceType, wage: dayWage };
    });

    return { totalWage, daysWorked: employeeAttendance.length, breakdown };
  };

  const getEmployeeAdvances = (employeeId: string) => {
    return wagePayments
      .filter(payment => payment.employeeId === employeeId)
      .reduce((total, payment) => total + payment.advanceAmount, 0);
  };

  const handleAdvancePayment = () => {
    if (!selectedEmployee || !advanceAmount) {
      toast({
        title: "Error",
        description: "Please select an employee and enter advance amount.",
        variant: "destructive",
      });
      return;
    }

    addWagePayment({
      employeeId: selectedEmployee,
      advanceAmount: parseFloat(advanceAmount),
      date: new Date().toISOString().split('T')[0],
      paidBy: user.id,
    });

    setSelectedEmployee('');
    setAdvanceAmount('');
    toast({
      title: "Success",
      description: "Advance payment recorded successfully!",
    });
  };

  const getWageCalculations = () => {
    if (!startDate || !endDate) return [];

    return userEmployees.map(employee => {
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
                  {userEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} ({employee.employeeId})
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
                          <div className="text-sm text-gray-500">{employee.employeeId}</div>
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
