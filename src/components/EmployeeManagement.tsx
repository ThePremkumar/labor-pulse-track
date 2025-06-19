
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Building2, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/pages/Index';
import { useEmployeeStore } from '@/store/employeeStore';

interface EmployeeManagementProps {
  user: User;
}

const EmployeeManagement = ({ user }: EmployeeManagementProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    jobCategory: '',
    dailyWage: '',
    siteLocation: user.siteLocation || '',
  });

  const { employees, addEmployee, removeEmployee } = useEmployeeStore();
  const { toast } = useToast();

  const userEmployees = user.role === 'admin' 
    ? employees 
    : employees.filter(emp => emp.siteLocation === user.siteLocation);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.employeeId || !formData.jobCategory || !formData.dailyWage || !formData.siteLocation) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate employee ID
    if (employees.some(emp => emp.employeeId === formData.employeeId)) {
      toast({
        title: "Error",
        description: "Employee ID already exists.",
        variant: "destructive",
      });
      return;
    }

    addEmployee({
      name: formData.name,
      employeeId: formData.employeeId,
      jobCategory: formData.jobCategory,
      dailyWage: parseFloat(formData.dailyWage),
      siteLocation: formData.siteLocation,
      addedBy: user.id,
    });

    setFormData({
      name: '',
      employeeId: '',
      jobCategory: '',
      dailyWage: '',
      siteLocation: user.siteLocation || '',
    });
    setIsDialogOpen(false);

    toast({
      title: "Success",
      description: "Employee added successfully!",
    });
  };

  const handleRemoveEmployee = (id: string) => {
    removeEmployee(id);
    toast({
      title: "Employee Removed",
      description: "Employee has been removed from the system.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
          <p className="text-gray-600">Manage your construction workforce</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>
                Enter the employee details below.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  placeholder="Enter unique employee ID"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="jobCategory">Job Category</Label>
                <Input
                  id="jobCategory"
                  value={formData.jobCategory}
                  onChange={(e) => setFormData({ ...formData, jobCategory: e.target.value })}
                  placeholder="e.g., Mason, Laborer, Carpenter"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dailyWage">Daily Wage (₹)</Label>
                <Input
                  id="dailyWage"
                  type="number"
                  value={formData.dailyWage}
                  onChange={(e) => setFormData({ ...formData, dailyWage: e.target.value })}
                  placeholder="Enter daily wage"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="siteLocation">Site Location</Label>
                <Input
                  id="siteLocation"
                  value={formData.siteLocation}
                  onChange={(e) => setFormData({ ...formData, siteLocation: e.target.value })}
                  placeholder="Enter site location"
                  required
                  disabled={user.role === 'supervisor'}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">Add Employee</Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Employee List
          </CardTitle>
          <CardDescription>
            {userEmployees.length} employees 
            {user.role === 'supervisor' && ` at ${user.siteLocation}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userEmployees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No employees found. Add your first employee to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Job Category</TableHead>
                    <TableHead>Daily Wage</TableHead>
                    <TableHead>Site Location</TableHead>
                    {user.role === 'admin' && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{employee.employeeId}</Badge>
                      </TableCell>
                      <TableCell>{employee.jobCategory}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ₹{employee.dailyWage}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{employee.siteLocation}</Badge>
                      </TableCell>
                      {user.role === 'admin' && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveEmployee(employee.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeManagement;
