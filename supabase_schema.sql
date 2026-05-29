-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ============================
-- BOOKINGS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  user_username TEXT,
  movie_id TEXT NOT NULL,
  movie_title TEXT NOT NULL,
  theater_name TEXT NOT NULL,
  show_date DATE NOT NULL,
  show_time TEXT NOT NULL,
  seats TEXT[] NOT NULL,
  total_price INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- ROW LEVEL SECURITY (RLS)
-- ============================
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings, and admin can view all bookings
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id OR (auth.jwt() ->> 'email') = 'cinemacabreadmin@gmail.com');

-- Users can only insert their own bookings
CREATE POLICY "Users can create own bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings (for cancellations)
CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================
-- INDEX for faster lookups
-- ============================
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);

-- ============================
-- MOVIES TABLE
-- ============================
CREATE TABLE IF NOT EXISTS movies (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  genre TEXT[] NOT NULL,
  rating NUMERIC,
  votes TEXT,
  duration TEXT,
  language TEXT,
  certification TEXT,
  "releaseDate" DATE,
  image TEXT,
  banner TEXT,
  synopsis TEXT,
  "cast" TEXT[],
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ============================
-- BOOKINGS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  user_username TEXT,
  movie_id TEXT NOT NULL,
  movie_title TEXT NOT NULL,
  theater_name TEXT NOT NULL,
  show_date DATE NOT NULL,
  show_time TEXT NOT NULL,
  seats TEXT[] NOT NULL,
  total_price INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- ROW LEVEL SECURITY (RLS)
-- ============================
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings, and admin can view all bookings
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id OR (auth.jwt() ->> 'email') = 'cinemacabreadmin@gmail.com');

-- Users can only insert their own bookings
CREATE POLICY "Users can create own bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings (for cancellations)
CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================
-- INDEX for faster lookups
-- ============================
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);

-- ============================
-- MOVIES TABLE
-- ============================
CREATE TABLE IF NOT EXISTS movies (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  genre TEXT[] NOT NULL,
  rating NUMERIC,
  votes TEXT,
  duration TEXT,
  language TEXT,
  certification TEXT,
  "releaseDate" DATE,
  image TEXT,
  banner TEXT,
  synopsis TEXT,
  "cast" TEXT[],
  director TEXT,
  price JSONB
);

ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view movies" ON movies FOR SELECT USING (true);

-- Insert initial dummy data in smaller batches to avoid truncation issues
INSERT INTO movies (id, title, genre, rating, votes, duration, language, certification, "releaseDate", image, banner, synopsis, "cast", director, price) VALUES
('1', 'The Haunting Shadows', ARRAY['Horror', 'Thriller'], 4.2, '12.4K', '2h 15m', 'English', 'A', '2024-10-25', 'https://images.unsplash.com/photo-1508349937151-22b68b72d5b1?q=80&w=1000&auto=format&fit=crop', 'https://images.unsplash.com/photo-1508349937151-22b68b72d5b1?q=80&w=2000&auto=format&fit=crop', 'A family moves into a decrepit Victorian mansion only to discover that the shadows themselves are alive — watching, whispering, and hungry for souls.', ARRAY['Sarah Mitchell', 'James Vorn', 'Elena Cruz'], 'Marcus Dread', '{"premium": 350, "executive": 250, "normal": 150}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO movies (id, title, genre, rating, votes, duration, language, certification, "releaseDate", image, banner, synopsis, "cast", director, price) VALUES
('2', 'Whispers in the Dark', ARRAY['Horror', 'Mystery'], 3.8, '8.7K', '1h 58m', 'English', 'A', '2024-10-28', 'https://images.unsplash.com/photo-1505635552518-3448ff116af3?q=80&w=1000&auto=format&fit=crop', 'https://images.unsplash.com/photo-1505635552518-3448ff116af3?q=80&w=2000&auto=format&fit=crop', 'You cannot see them, but they see you. In a remote village plagued by disappearances, a journalist uncovers an ancient evil.', ARRAY['David Park', 'Lina Torres', 'Omar Khalil'], 'Julia Graves', '{"premium": 400, "executive": 280, "normal": 180}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO movies (id, title, genre, rating, votes, duration, language, certification, "releaseDate", image, banner, synopsis, "cast", director, price) VALUES
('3', 'Crimson Nightmare', ARRAY['Horror', 'Supernatural'], 4.5, '22.1K', '2h 05m', 'English', 'A', '2024-11-01', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2000&auto=format&fit=crop', 'A dream researcher becomes trapped in a blood-soaked dimension where nightmares manifest as physical reality.', ARRAY['Rachel Voss', 'Ken Tanaka', 'Priya Sharma'], 'Vincent Mortem', '{"premium": 450, "executive": 320, "normal": 200}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO movies (id, title, genre, rating, votes, duration, language, certification, "releaseDate", image, banner, synopsis, "cast", director, price) VALUES
('4', 'Echoes of Terror', ARRAY['Horror', 'Psychological'], 4.0, '15.3K', '2h 10m', 'English', 'A', '2024-11-05', 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=1000&auto=format&fit=crop', 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=2000&auto=format&fit=crop', 'Every sound you make is echoed back by something sinister lurking in the abandoned asylum.', ARRAY['Michael Crane', 'Sofia Reyes', 'Andre Blake'], 'Nora Abyss', '{"premium": 380, "executive": 260, "normal": 160}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO movies (id, title, genre, rating, votes, duration, language, certification, "releaseDate", image, banner, synopsis, "cast", director, price) VALUES
('5', 'The Last Séance', ARRAY['Horror', 'Occult'], 4.7, '31.5K', '2h 20m', 'English', 'A', '2024-11-08', 'https://images.unsplash.com/photo-1519074002996-a69e7ac46a42?q=80&w=1000&auto=format&fit=crop', 'https://images.unsplash.com/photo-1519074002996-a69e7ac46a42?q=80&w=2000&auto=format&fit=crop', 'A renowned medium conducts one final séance to contact a malevolent spirit. What she summons is far worse.', ARRAY['Isabelle Mourn', 'Thomas Veil', 'Yuki Sato'], 'Marcus Dread', '{"premium": 500, "executive": 350, "normal": 220}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO movies (id, title, genre, rating, votes, duration, language, certification, "releaseDate", image, banner, synopsis, "cast", director, price) VALUES
('6', 'Beneath the Floorboards', ARRAY['Horror', 'Slasher'], 3.5, '6.2K', '1h 45m', 'English', 'A', '2024-11-12', 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=1000&auto=format&fit=crop', 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=2000&auto=format&fit=crop', 'A couple renovating their dream home discovers something scratching beneath the floorboards every night at 3:33 AM.', ARRAY['Hannah Cole', 'Ryan Asher', 'Diana Webb'], 'Julia Graves', '{"premium": 300, "executive": 200, "normal": 120}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO movies (id, title, genre, rating, votes, duration, language, certification, "releaseDate", image, banner, synopsis, "cast", director, price) VALUES
('7', 'Boulevard of Sins', ARRAY['Horror', 'Drama'], 4.1, '18.9K', '2h 30m', 'English', 'A', '2024-11-15', 'https://images.unsplash.com/photo-1599839619722-39751411ea63?q=80&w=1000&auto=format&fit=crop', 'https://images.unsplash.com/photo-1599839619722-39751411ea63?q=80&w=2000&auto=format&fit=crop', 'On a cursed street where every step costs you a piece of your soul, seven strangers must walk to the end before dawn.', ARRAY['Marcus Flynn', 'Zara Nightingale', 'Leo Stein'], 'Vincent Mortem', '{"premium": 420, "executive": 300, "normal": 180}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO movies (id, title, genre, rating, votes, duration, language, certification, "releaseDate", image, banner, synopsis, "cast", director, price) VALUES
('8', 'Death of the Citadel', ARRAY['Horror', 'Fantasy'], 4.3, '25.8K', '2h 40m', 'English', 'A', '2024-11-20', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1000&auto=format&fit=crop', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=2000&auto=format&fit=crop', 'An ancient fortress awakens to claim the living. A group of archaeologists triggers an apocalyptic curse.', ARRAY['Helena Storm', 'Rajan Patel', 'Erik Volkov'], 'Nora Abyss', '{"premium": 480, "executive": 340, "normal": 210}')
ON CONFLICT (id) DO NOTHING;
