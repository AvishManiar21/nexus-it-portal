from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import products, events, rfd, auth, leads, engagement
import os
from dotenv import load_dotenv

# Load env variables
load_dotenv()

app = FastAPI(title="Nexus IT Backend")

# Configure CORS
origins = [
    os.getenv("FRONTEND_URL", "http://localhost:3000")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(products.router)
app.include_router(events.router)
app.include_router(rfd.router)
app.include_router(auth.router)
app.include_router(leads.router)
app.include_router(engagement.router)

@app.get("/")
def root():
    return {"message": "Backend is running!"}

@app.get("/env-test")
def env_test():
    from os import getenv
    return {
        "DATABASE_URL": getenv("DATABASE_URL"),
        "SECRET_KEY": getenv("SECRET_KEY"),
        "EMAIL_USER": getenv("EMAIL_USER"),
        "FRONTEND_URL": getenv("FRONTEND_URL")
    }
