-- Create table for storing IELTS writing practice essays
CREATE TABLE IF NOT EXISTS public.ielts_essays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.ielts_essays ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own essays" ON public.ielts_essays
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own essays" ON public.ielts_essays
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own essays" ON public.ielts_essays
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own essays" ON public.ielts_essays
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_ielts_essays_user_id ON public.ielts_essays(user_id);
CREATE INDEX IF NOT EXISTS idx_ielts_essays_created_at ON public.ielts_essays(created_at DESC);
