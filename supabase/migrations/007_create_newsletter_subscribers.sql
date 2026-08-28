-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  subscribed_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts so any visitor can subscribe to the newsletter
CREATE POLICY "Allow anonymous inserts to newsletter_subscribers"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to view subscribers (for admin dashboard viewing)
CREATE POLICY "Allow read for authenticated users"
  ON newsletter_subscribers FOR SELECT
  TO authenticated
  USING (true);
