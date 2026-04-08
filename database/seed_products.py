"""
US-34: Seed Initial Product Data
Inserts Cloud Services, Cybersecurity Solutions, and AI Analytics.
Idempotent — skips products that already exist (matched by name).
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import supabase

PRODUCTS = [
    {
        "name": "Cloud Services",
        "category": "Cloud",
        "description": (
            "Scalable cloud infrastructure solutions designed for businesses of all sizes. "
            "Our Cloud Services provide secure, high-availability hosting, automated backups, "
            "and seamless migration support. Whether you need public, private, or hybrid cloud "
            "environments, Nexus-IT delivers enterprise-grade reliability with flexible pricing."
        ),
        "price": 0.0,
        "image_url": "/images/cloud-services.jpg",
        "demo_video": "https://www.youtube.com/embed/dQw4w9WgXcQ",
    },
    {
        "name": "Cybersecurity Solutions",
        "category": "Security",
        "description": (
            "Comprehensive cybersecurity services to protect your organization from evolving threats. "
            "Our solutions include 24/7 threat monitoring, vulnerability assessments, penetration testing, "
            "incident response planning, and compliance auditing. Nexus-IT helps safeguard your data, "
            "networks, and endpoints with industry-leading tools and expert guidance."
        ),
        "price": 0.0,
        "image_url": "/images/cybersecurity-solutions.jpg",
        "demo_video": "https://www.youtube.com/embed/dQw4w9WgXcQ",
    },
    {
        "name": "AI Analytics",
        "category": "Analytics",
        "description": (
            "Harness the power of artificial intelligence to turn raw data into actionable insights. "
            "Our AI Analytics platform offers predictive modeling, natural language processing, "
            "real-time dashboards, and automated reporting. Nexus-IT empowers your team to make "
            "data-driven decisions faster and with greater confidence."
        ),
        "price": 0.0,
        "image_url": "/images/ai-analytics.jpg",
        "demo_video": "https://www.youtube.com/embed/dQw4w9WgXcQ",
    },
]


def seed():
    for product in PRODUCTS:
        # Check if product already exists by name
        existing = (
            supabase.table("products")
            .select("id")
            .eq("name", product["name"])
            .execute()
        )

        if existing.data:
            print(f"  Skipped (already exists): {product['name']}")
        else:
            supabase.table("products").insert(product).execute()
            print(f"  Inserted: {product['name']}")


if __name__ == "__main__":
    print("Seeding products...")
    seed()
    print("Done.")
