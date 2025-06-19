
-- Create a profiles table to store additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'supervisor')),
  site_location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  employee_id TEXT NOT NULL UNIQUE,
  job_category TEXT NOT NULL,
  daily_wage DECIMAL(10,2) NOT NULL,
  site_location TEXT NOT NULL,
  added_by UUID NOT NULL REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance records table
CREATE TABLE public.attendance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees ON DELETE CASCADE,
  date DATE NOT NULL,
  attendance_type TEXT NOT NULL CHECK (attendance_type IN ('full', 'half', '1.5')),
  marked_by UUID NOT NULL REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Create wage payments table
CREATE TABLE public.wage_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees ON DELETE CASCADE,
  advance_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  paid_by UUID NOT NULL REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wage_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for employees (Admins see all, Supervisors see their site)
CREATE POLICY "Admins can view all employees" ON public.employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Supervisors can view employees from their site" ON public.employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'supervisor' 
      AND profiles.site_location = employees.site_location
    )
  );

CREATE POLICY "Authenticated users can insert employees" ON public.employees
  FOR INSERT WITH CHECK (auth.uid() = added_by);

-- RLS Policies for attendance records
CREATE POLICY "Admins can view all attendance" ON public.attendance_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Supervisors can view attendance from their site" ON public.attendance_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.employees e ON e.id = attendance_records.employee_id
      WHERE p.id = auth.uid() 
      AND p.role = 'supervisor' 
      AND p.site_location = e.site_location
    )
  );

CREATE POLICY "Authenticated users can insert attendance" ON public.attendance_records
  FOR INSERT WITH CHECK (auth.uid() = marked_by);

-- RLS Policies for wage payments
CREATE POLICY "Admins can view all wage payments" ON public.wage_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Supervisors can view wage payments from their site" ON public.wage_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.employees e ON e.id = wage_payments.employee_id
      WHERE p.id = auth.uid() 
      AND p.role = 'supervisor' 
      AND p.site_location = e.site_location
    )
  );

CREATE POLICY "Authenticated users can insert wage payments" ON public.wage_payments
  FOR INSERT WITH CHECK (auth.uid() = paid_by);

-- Create a function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'supervisor')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
