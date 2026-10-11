-- Product catalog for a fresh database (loaded by `supabase db reset` / `supabase start`).
-- Admin users are not seeded: create one with scripts/create_admin.py.

INSERT INTO products (name, description, category, price, image_url, demo_video) VALUES
    ('Cloud Infrastructure Suite', 'Enterprise-grade cloud infrastructure management platform with automated scaling, monitoring, and security features.', 'Infrastructure', 2999.99, 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80', 'https://www.youtube.com/watch?v=RWgW-CgdIk0'),
    ('AI Analytics Dashboard', 'Advanced analytics platform powered by machine learning for real-time business insights and predictive modeling.', 'Analytics', 1999.99, 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80', 'https://www.youtube.com/watch?v=Rlkkl2wc4pQ'),
    ('Cybersecurity Shield', 'Comprehensive cybersecurity solution with threat detection, vulnerability scanning, and automated response capabilities.', 'Security', 3499.99, 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80', 'https://www.youtube.com/watch?v=-FSjnGjzSLQ');
