-- Create tables
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    profile_image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    content TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    post_id INTEGER NOT NULL REFERENCES posts(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE likes (
    user_id INTEGER NOT NULL REFERENCES users(id),
    post_id INTEGER REFERENCES posts(id),
    comment_id INTEGER REFERENCES comments(id),
    PRIMARY KEY (user_id, post_id, comment_id),
    CHECK ((post_id IS NULL AND comment_id IS NOT NULL) OR (post_id IS NOT NULL AND comment_id IS NULL))
);

-- Seed data
INSERT INTO users (username, email, password_hash, full_name, profile_image_url) VALUES
('john_doe', 'john@example.com', 'password123', 'John Doe', 'https://picsum.photos/seed/john_doe/200/300'),
('jane_smith', 'jane@example.com', 'admin123', 'Jane Smith', 'https://picsum.photos/seed/jane_smith/200/300'),
('mike_brown', 'mike@example.com', 'user123', 'Mike Brown', 'https://picsum.photos/seed/mike_brown/200/300'),
('sarah_wilson', 'sarah@example.com', 'password123', 'Sarah Wilson', 'https://picsum.photos/seed/sarah_wilson/200/300'),
('alex_jones', 'alex@example.com', 'admin123', 'Alex Jones', 'https://picsum.photos/seed/alex_jones/200/300');

INSERT INTO posts (user_id, title, content, image_url) VALUES
(1, 'First Post', 'This is my first post!', 'https://picsum.photos/seed/post1/800/600'),
(1, 'Nature Photography', 'Beautiful mountain view', 'https://picsum.photos/seed/post2/800/600'),
(2, 'Travel Diary', 'Exploring new countries', 'https://picsum.photos/seed/post3/800/600'),
(3, 'Tech Review', 'Review of latest gadgets', 'https://picsum.photos/seed/post4/800/600'),
(4, 'Foodie Adventures', 'Trying new recipes', 'https://picsum.photos/seed/post5/800/600'),
(5, 'Fitness Journey', 'Daily workout routine', 'https://picsum.photos/seed/post6/800/600');

INSERT INTO comments (user_id, post_id, content) VALUES
(2, 1, 'Great first post!'),
(3, 1, 'Looking forward to more content'),
(1, 2, 'Thanks for the kind words!'),
(4, 3, 'Amazing travel stories'),
(5, 4, 'Very informative review'),
(2, 5, 'Yummy recipes!');

INSERT INTO likes (user_id, post_id) VALUES
(2, 1),
(3, 1),
(4, 2),
(5, 3),
(1, 4),
(2, 5);

INSERT INTO likes (user_id, comment_id) VALUES
(1, 1),
(3, 2),
(4, 3),
(5, 4),
(2, 5);