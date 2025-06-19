
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSpreadsheet, Download, Filter, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/pages/Index';
import { useEmployeeStore } from '@/store/employeeStore';
import { useAttendanceStore } from '@/store/attendanceStore';
import { useWageStore } from '@/store/wageStore';

interface ReportsAndExportsProps {
  user: User;
}

const ReportsAndExports = ({ user }: ReportsAndExportsProps) => {
  const [filterType, setFilterType] = useState<'all' | 'employee' | 'site'>('all');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { employees } = useEmployeeStore();
  const { attendanceRecords } = useAttendanceStore();
  const { wagePayments } = useWageStore();
  const { toast } = useToast();

  const userEmployees = user.role === 'admin' 
    ? employees 
    : employees.filter(emp => emp.siteLocation === user.siteLocation);

  const sites = Array.from(new Set(employees.map(emp => emp.siteLocation)));

  const getFilteredData = () => {
    let filteredAttendance = attendanceRecords;

    // Filter by date range
    if (startDate && endDate) {
      filteredAttendance = filteredAttendance.filter(
        record => record.date >= startDate && record.date <= endDate
      );
    }

    // Filter by employee
    if (filterType === 'employee' && selectedEmployee) {
      filteredAttendance = filteredAttendance.filter(
        record => record.employeeId === selectedEmployee
      );
    }

    // Filter by site
    if (filterType === 'site' && selectedSite) {
      const siteEmployees = employees.filter(emp => emp.siteLocation === selectedSite);
      const siteEmployeeIds = siteEmployees.map(emp => emp.id);
      filteredAttendance = filteredAttendance.filter(
        record => siteEmployeeIds.includes(record.employeeId)
      );
    }

    // Filter by user role
    if (user.role === 'supervisor') {
      const supervisorEmployeeIds = userEmployees.map(emp => emp.id);
      filteredAttendance = filteredAttendance.filter(
        record => supervisorEmployeeIds.includes(record.employeeId)
      );
    }

    return filteredAttendance;
  };

  const generateReport = () => {
    const filteredData = getFilteredData();
    
    const reportData = filteredData.map(record => {
      const employee = employees.find(emp => emp.id === record.employeeId);
      const attendanceTypeInfo = {
        'full': { label: 'Full Day', multiplier: 1 },
        'half': { label: 'Half Day', multiplier: 0.5 },
        '1.5': { label: '1.5 Day', multiplier: 1.5 }
      };
      
      const typeInfo = attendanceTypeInfo[record.attendanceType];
      const dailyWage = employee ? employee.dailyWage * typeInfo.multiplier : 0;

      return {
        employeeName: employee?.name || 'Unknown',
        employeeId: employee?.employeeId || 'Unknown',
        jobCategory: employee?.jobCategory || 'Unknown',
        siteLocation: employee?.siteLocation || 'Unknown',
        date: record.date,
        attendanceType: typeInfo.label,
        dailyWage: employee?.dailyWage || 0,
        calculatedWage: dailyWage,
      };
    });

    return reportData;
  };

  const exportToCSV = () => {
    const reportData = generateReport();
    
    if (reportData.length === 0) {
      toast({
        title: "No Data",
        description: "No data available for the selected filters.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      'Employee Name',
      'Employee ID', 
      'Job Category',
      'Site Location',
      'Date',
      'Attendance Type',
      'Daily Wage (₹)',
      'Calculated Wage (₹)'
    ];

    const csvContent = [
      headers.join(','),
      ...reportData.map(row => [
        row.employeeName,
        row.employeeId,
        row.jobCategory,
        row.siteLocation,
        row.date,
        row.attendanceType,
        row.dailyWage,
        row.calculatedWage.toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: "Attendance report has been downloaded as CSV file.",
    });
  };

  const getStatistics = () => {
    const reportData = generateReport();
    const totalWages = reportData.reduce((sum, record) => sum + record.calculatedWage, 0);
    const uniqueEmployees = new Set(reportData.map(record => record.employeeId)).size;
    const uniqueSites = new Set(reportData.map(record => record.siteLocation)).size;

    return {
      totalRecords: reportData.length,
      totalWages,
      uniqueEmployees,
      uniqueSites,
    };
  };

  const stats = getStatistics();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reports & Exports</h2>
        <p className="text-gray-600">Generate and export attendance reports</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Report Filters
          </CardTitle>
          <CardDescription>
            Configure filters for your report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Filter Type</label>
              <Select value={filterType} onValueChange={(value: 'all' | 'employee' | 'site') => setFilterType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Records</SelectItem>
                  <SelectItem value="employee">Specific Employee</SelectItem>
                  {user.role === 'admin' && <SelectItem value="site">Specific Site</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {filterType === 'employee' && (
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
            )}

            {filterType === 'site' && user.role === 'admin' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Site Location</label>
                <Select value={selectedSite} onValueChange={setSelectedSite}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((site) => (
                      <SelectItem key={site} value={site}>
                        {site}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Button 
            onClick={exportToCSV}
            className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Export to CSV
          </Button>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Records</p>
                <p className="text-2xl font-bold">{stats.totalRecords}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Total Wages</p>
                <p className="text-2xl font-bold">₹{stats.totalWages.toFixed(0)}</p>
              </div>
              <FileSpreadsheet className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Employees</p>
                <p className="text-2xl font-bold">{stats.uniqueEmployees}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Sites</p>
                <p className="text-2xl font-bold">{stats.uniqueSites}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Report Preview
          </CardTitle>
          <CardDescription>
            Preview of filtered attendance data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Wage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generateReport().slice(0, 10).map((record, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{record.employeeName}</div>
                        <div className="text-sm text-gray-500">{record.employeeId}</div>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{record.siteLocation}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.attendanceType}</Badge>
                    </TableCell>
                    <TableCell>₹{record.calculatedWage.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {generateReport().length > 10 && (
              <div className="text-center py-4 text-gray-500">
                ... and {generateReport().length - 10} more records
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsAndExports;
