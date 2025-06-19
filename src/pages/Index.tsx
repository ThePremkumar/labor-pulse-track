
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import LoginForm from '@/components/LoginForm';
import Dashboard from '@/components/Dashboard';

export type UserRole = 'admin' | 'supervisor';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  site_location?: string;
}

// Updated interfaces to match database schema
export interface Employee {
  id: string;
  name: string;
  employee_id: string;
  job_category: string;
  daily_wage: number;
  site_location: string;
  added_by: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  attendance_type: 'full' | 'half' | '1.5';
  marked_by: string;
  created_at: string;
}

export interface WagePayment {
  id: string;
  employee_id: string;
  advance_amount: number;
  date: string;
  paid_by: string;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            setUserProfile({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              role: profile.role as UserRole,
              site_location: profile.site_location
            });
          }
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {!user || !userProfile ? (
        <LoginForm />
      ) : (
        <Dashboard user={userProfile} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default Index;
