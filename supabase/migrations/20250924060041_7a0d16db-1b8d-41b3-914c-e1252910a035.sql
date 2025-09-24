-- Create video_questions table
CREATE TABLE public.video_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_task_id UUID NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  correct_option TEXT NOT NULL CHECK (correct_option IN ('a', 'b')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_video_answers table
CREATE TABLE public.user_video_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_task_id UUID NOT NULL,
  question_id UUID NOT NULL,
  selected_option TEXT NOT NULL CHECK (selected_option IN ('a', 'b')),
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_video_answers ENABLE ROW LEVEL SECURITY;

-- RLS policies for video_questions
CREATE POLICY "Everyone can view video questions" 
ON public.video_questions 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage video questions" 
ON public.video_questions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for user_video_answers
CREATE POLICY "Users can create their own answers" 
ON public.user_video_answers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own answers" 
ON public.user_video_answers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all answers" 
ON public.user_video_answers 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add foreign key relationships
ALTER TABLE public.video_questions
ADD CONSTRAINT video_questions_video_task_id_fkey 
FOREIGN KEY (video_task_id) REFERENCES public.video_tasks(id) ON DELETE CASCADE;

ALTER TABLE public.user_video_answers
ADD CONSTRAINT user_video_answers_question_id_fkey 
FOREIGN KEY (question_id) REFERENCES public.video_questions(id) ON DELETE CASCADE;

-- Add unique constraint to prevent duplicate answers
ALTER TABLE public.user_video_answers
ADD CONSTRAINT unique_user_question_answer 
UNIQUE (user_id, question_id);

-- Add triggers for updated_at
CREATE TRIGGER update_video_questions_updated_at
BEFORE UPDATE ON public.video_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add realtime
ALTER TABLE public.video_questions REPLICA IDENTITY FULL;
ALTER TABLE public.user_video_answers REPLICA IDENTITY FULL;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_video_answers;