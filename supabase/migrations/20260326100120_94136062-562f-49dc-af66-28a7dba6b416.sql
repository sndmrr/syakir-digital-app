-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'mitra');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create table for storing user settings (saldo awal)
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  saldo_awal NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for tagihan (bills)
CREATE TABLE public.tagihan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  nama TEXT NOT NULL,
  jumlah NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'belum_lunas' CHECK (status IN ('belum_lunas', 'lunas')),
  nama_input TEXT,
  nama_lunas TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  can_edit_data BOOLEAN NOT NULL DEFAULT true,
  can_delete_data BOOLEAN NOT NULL DEFAULT true,
  can_lunas_data BOOLEAN NOT NULL DEFAULT true,
  tanggal_setor TEXT DEFAULT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create pending_registrations table
CREATE TABLE public.pending_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Create notifikasi_user table
CREATE TABLE public.notifikasi_user (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'all',
  target_user_id UUID NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create deposit_date_settings table
CREATE TABLE public.deposit_date_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deposit_date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create push_subscriptions table
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Create profit_settings table
CREATE TABLE public.profit_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profit_amount NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on all tables
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tagihan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifikasi_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_date_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profit_settings ENABLE ROW LEVEL SECURITY;

-- Security definer functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_global_sisa_saldo()
RETURNS TABLE (
  total_saldo_induk numeric,
  total_tagihan_aktif numeric,
  total_bayar numeric,
  sisa_saldo_global numeric
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_total_saldo_induk numeric;
  v_total_tagihan_aktif numeric;
  v_total_bayar numeric;
BEGIN
  SELECT COALESCE(SUM(s.saldo_awal), 0) INTO v_total_saldo_induk
  FROM settings s INNER JOIN user_roles ur ON s.user_id = ur.user_id WHERE ur.role = 'admin';
  SELECT COALESCE(SUM(jumlah), 0) INTO v_total_tagihan_aktif
  FROM tagihan WHERE status = 'belum_lunas' AND deleted_at IS NULL;
  SELECT COALESCE(SUM(jumlah), 0) INTO v_total_bayar
  FROM tagihan WHERE status = 'lunas' AND deleted_at IS NULL;
  RETURN QUERY SELECT v_total_saldo_induk, v_total_tagihan_aktif, v_total_bayar,
    v_total_saldo_induk - v_total_tagihan_aktif - v_total_bayar;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_global_sisa_saldo() TO authenticated;

-- RLS Policies: settings
CREATE POLICY "Users can view their own settings" ON public.settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own settings" ON public.settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON public.settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON public.settings FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: tagihan
CREATE POLICY "Users can view their own active tagihan" ON public.tagihan FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY "Users can view their own deleted tagihan" ON public.tagihan FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NOT NULL);
CREATE POLICY "Admins can view all tagihan" ON public.tagihan FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create their own tagihan" ON public.tagihan FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own active tagihan" ON public.tagihan FOR UPDATE USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY "Admins can update any tagihan" ON public.tagihan FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete tagihan" ON public.tagihan FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies: user_roles
CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies: profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies: pending_registrations
CREATE POLICY "Anyone can register" ON public.pending_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view pending registrations" ON public.pending_registrations FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update pending registrations" ON public.pending_registrations FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete pending registrations" ON public.pending_registrations FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies: notifikasi_user
CREATE POLICY "Admins can manage notifications" ON public.notifikasi_user FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view their notifications" ON public.notifikasi_user FOR SELECT USING (auth.uid() IS NOT NULL AND (target_type = 'all' OR target_user_id = auth.uid()));
CREATE POLICY "Users can mark notifications as read" ON public.notifikasi_user FOR UPDATE USING (auth.uid() IS NOT NULL AND (target_type = 'all' OR target_user_id = auth.uid()));

-- RLS Policies: deposit_date_settings
CREATE POLICY "Admins can manage deposit date" ON public.deposit_date_settings FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view deposit date" ON public.deposit_date_settings FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies: push_subscriptions
CREATE POLICY "Users can manage own subscriptions" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all subscriptions" ON public.push_subscriptions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies: profit_settings
CREATE POLICY "Admins can manage profit_settings" ON public.profit_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "All authenticated can read profit_settings" ON public.profit_settings FOR SELECT TO authenticated USING (true);

-- Indexes
CREATE INDEX idx_tagihan_deleted_at ON public.tagihan(deleted_at) WHERE deleted_at IS NOT NULL;

-- Triggers
CREATE TRIGGER settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tagihan_updated_at BEFORE UPDATE ON public.tagihan FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_pending_registrations_updated_at BEFORE UPDATE ON public.pending_registrations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_deposit_date_settings_updated_at BEFORE UPDATE ON public.deposit_date_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Realtime
ALTER TABLE public.settings REPLICA IDENTITY FULL;
ALTER TABLE public.tagihan REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tagihan;
ALTER PUBLICATION supabase_realtime ADD TABLE public.push_subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deposit_date_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifikasi_user;

-- Auto-create settings for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE PLPGSQL SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.settings (user_id, saldo_awal) VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default profit settings
INSERT INTO public.profit_settings (profit_amount) VALUES (0);