-- Create cards table
CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  title TEXT,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  front_images JSONB DEFAULT '[]'::jsonb, -- Array of image URLs/paths for front
  back_images JSONB DEFAULT '[]'::jsonb,  -- Array of image URLs/paths for back
  "group" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create review_logs table
CREATE TABLE review_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  ts BIGINT NOT NULL,
  grade TEXT NOT NULL CHECK (grade IN ('again', 'hard', 'good', 'easy', 'view')),
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_review_logs_card_id ON review_logs(card_id);
CREATE INDEX idx_review_logs_ts ON review_logs(ts);
CREATE INDEX idx_cards_group ON cards("group");

-- Create storage bucket for flashcard images
INSERT INTO storage.buckets (id, name, public) VALUES ('flashcard-images', 'flashcard-images', true);

-- Create storage policy to allow public access to images
CREATE POLICY "Public access to flashcard images" ON storage.objects
  FOR SELECT USING (bucket_id = 'flashcard-images');

CREATE POLICY "Allow uploads to flashcard images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'flashcard-images');

-- Enable Row Level Security (optional)
-- ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE review_logs ENABLE ROW LEVEL SECURITY;
