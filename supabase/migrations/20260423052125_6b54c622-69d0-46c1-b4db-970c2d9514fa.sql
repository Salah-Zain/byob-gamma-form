
-- App role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Submissions table
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  stage TEXT NOT NULL,
  idea_sentence TEXT NOT NULL,
  building_what TEXT NOT NULL,
  target_customer TEXT NOT NULL,
  problem TEXT NOT NULL,
  current_solutions TEXT NOT NULL,
  why_switch TEXT NOT NULL,
  done_so_far TEXT[] NOT NULL DEFAULT '{}',
  bottleneck TEXT NOT NULL,
  hours_weekly TEXT NOT NULL,
  outcome TEXT NOT NULL,
  agreed BOOLEAN NOT NULL DEFAULT FALSE
);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can submit an application
CREATE POLICY "Anyone can submit an application"
ON public.submissions FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Only admins can view submissions
CREATE POLICY "Admins can view all submissions"
ON public.submissions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_submissions_submitted_at ON public.submissions(submitted_at DESC);
