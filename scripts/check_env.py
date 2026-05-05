#!/usr/bin/env python3
import os
from dotenv import load_dotenv

load_dotenv(override=True)

print("Environment variables:")
print(f"SUPABASE_URL: {os.getenv('SUPABASE_URL')}")
print(f"SUPABASE_SERVICE_ROLE_KEY: {os.getenv('SUPABASE_SERVICE_ROLE_KEY')[:30]}...")
