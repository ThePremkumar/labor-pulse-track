
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Mail, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User, UserRole } from '@/pages/Index';

interface LoginFormProps {
  onLogin: (user: User) => void;
}

// Mock user database for demo purposes
const mockUsers = [
  {
    id: 'admin_1',
    name: 'John Admin',
    email: 'admin@company.com',
    password: 'admin123',
    role: 'admin' as UserRole,
  },
  {
    id: 'supervisor_1',
    name: 'Jane Supervisor',
    email: 'supervisor@company.com',
    password: 'super123',
    role: 'supervisor' as UserRole,
    siteLocation: 'Downtown Site',
  },
];

const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const user = mockUsers.find(
        u => u.email === email && u.password === password
      );
      
      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        onLogin(userWithoutPassword);
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid email or password.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-orange-500 rounded-2xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
            Construction Manager
          </CardTitle>
          <CardDescription className="text-gray-600">
            Labor Attendance & Wage Management System
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="h-11 pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="h-11 pl-10"
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-medium transition-all duration-200"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
            <p className="font-medium mb-2">Demo Credentials:</p>
            <p><strong>Admin:</strong> admin@company.com / admin123</p>
            <p><strong>Supervisor:</strong> supervisor@company.com / super123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
