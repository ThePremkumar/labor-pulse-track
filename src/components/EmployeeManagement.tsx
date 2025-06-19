
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Building2, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { UserProfile, Employee } from '@/pages/Index';

interface EmployeeManagementProps {
  user: UserProfile;
}

const EmployeeManagement = ({ user }: EmployeeManagementProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    employee_id: '',
    job_category: '',
    daily_wage: '',
    site_location: user.site_location || '',
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees();
  }, [user]);

  const fetchEmployees = async () => {
    try {
      let query = supabase.from('employees').select('*');
      
      if (user.role === 'supervisor' && user.site_location) {
        query = query.eq('site_location', user.site_location);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setEmployees(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to fetch employees.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.employee_id || !formData.job_category || !formData.daily_wage || !formData.site_location) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate employee ID
    if (employees.some(emp => emp.employee_id === formData.employee_id)) {
      toast({
        title: "Error",
        description: "Employee ID already exists.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('employees')
        .insert({
          name: formData.name,
          employee_id: formData.employee_id,
          job_category: formData.job_category,
          daily_wage: parseFloat(formData.daily_wage),
          site_location: formData.site_location,
          added_by: user.id,
        });

      if (error) throw error;

      await fetchEmployees();
      setFormData({
        name: '',
        employee_id: '',
        job_category: '',
        daily_wage: '',
        site_location: user.site_location || '',
      });
      setIsDialogOpen(false);

      toast({
        title: "Success",
        description: "Employee added successfully!",
      });
    } catch (error) {
      console.error('Error adding employee:', error);
      toast({
        title: "Error",
        description: "Failed to add employee. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveEmployee = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchEmployees();
      toast({
        title: "Employee Removed",
        description: "Employee has been removed from the system.",
      });
    } catch (error) {
      console.error('Error removing employee:', error);
      toast({
        title: "Error",
        description: "Failed to remove employee. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

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
                <Label htmlFor="employee_id">Employee ID</Label>
                <Input
                  id="employee_id"
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  placeholder="Enter unique employee ID"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="job_category">Job Category</Label>
                <Input
                  id="job_category"
                  value={formData.job_category}
                  onChange={(e) => setFormData({ ...formData, job_category: e.target.value })}
                  placeholder="e.g., Mason, Laborer, Carpenter"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="daily_wage">Daily Wage (₹)</Label>
                <Input
                  id="daily_wage"
                  type="number"
                  value={formData.daily_wage}
                  onChange={(e) => setFormData({ ...formData, daily_wage: e.target.value })}
                  placeholder="Enter daily wage"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="site_location">Site Location</Label>
                <Input
                  id="site_location"
                  value={formData.site_location}
                  onChange={(e) => setFormData({ ...formData, site_location: e.target.value })}
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
            {employees.length} employees 
            {user.role === 'supervisor' && ` at ${user.site_location}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
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
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{employee.employee_id}</Badge>
                      </TableCell>
                      <TableCell>{employee.job_category}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ₹{employee.daily_wage}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{employee.site_location}</Badge>
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
