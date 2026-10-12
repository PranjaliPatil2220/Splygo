"""
SplyGo - Python Backend API Server
FastAPI proxy for Weather, Config, and static asset serving.
"""

import os
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from dotenv import load_dotenv
import requests

# Load environment variables from .env
load_dotenv()

app = FastAPI(
    title="SplyGo API",
    description="Backend services for SplyGo Urban Informatics Platform",
    version="1.0.0"
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Keys from Environment
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
MAPBOX_TOKEN = os.getenv("MAPBOX_TOKEN", "")

# -----------------------------------------------------------------------------
# 1. Configuration Endpoint (Public Safe Keys for Frontend)
# -----------------------------------------------------------------------------
@app.get("/api/config")
async def get_client_config():
    """
    Exposes client-safe public keys to the frontend so they don't need
    to be hardcoded in JavaScript files.
    """
    return {
        "google_client_id": GOOGLE_CLIENT_ID,
        "mapbox_token": MAPBOX_TOKEN,
        "google_api_key_present": bool(GOOGLE_API_KEY and GOOGLE_API_KEY != "your_google_api_key_here"),
        "weather_configured": bool(OPENWEATHER_API_KEY and OPENWEATHER_API_KEY != "your_openweather_api_key_here")
    }

# -----------------------------------------------------------------------------
# 2. OpenWeatherMap Proxy Route
# -----------------------------------------------------------------------------
@app.get("/api/weather")
async def get_weather(
    lat: float = Query(40.7128, description="Latitude"),
    lon: float = Query(-74.0060, description="Longitude"),
    units: str = Query("imperial", description="Units: imperial (F) or metric (C)")
):
    """
    Proxies calls to OpenWeatherMap API to keep OPENWEATHER_API_KEY confidential.
    If the key is missing or placeholder, returns a realistic fallback for UI testing.
    """
    is_placeholder = (
        not OPENWEATHER_API_KEY 
        or "your_openweather" in OPENWEATHER_API_KEY.lower()
    )

    if not is_placeholder:
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {
            "lat": lat,
            "lon": lon,
            "appid": OPENWEATHER_API_KEY,
            "units": units
        }
        try:
            resp = requests.get(url, params=params, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "source": "live",
                    "temp": round(data["main"]["temp"]),
                    "feels_like": round(data["main"]["feels_like"]),
                    "condition": data["weather"][0]["main"],
                    "description": data["weather"][0]["description"].title(),
                    "icon": data["weather"][0]["icon"],
                    "city": data.get("name", "Downtown"),
                    "humidity": data["main"]["humidity"],
                    "wind_speed": data["wind"]["speed"]
                }
            else:
                # Upstream error (e.g. invalid key or rate limit)
                print(f"[Warning] OpenWeatherMap upstream error: {resp.status_code} - {resp.text}")
        except Exception as e:
            print(f"[Error] OpenWeatherMap request failed: {e}")

    # Fallback simulation if no valid key is configured yet
    return {
        "source": "simulated",
        "temp": 72 if units == "imperial" else 22,
        "feels_like": 70 if units == "imperial" else 21,
        "condition": "Sunny",
        "description": "Clear & Pleasant",
        "icon": "01d",
        "city": "Lower Manhattan",
        "humidity": 48,
        "wind_speed": 6.5,
        "note": "Using simulated weather. Provide a valid OPENWEATHER_API_KEY in .env to activate live radar."
    }

# -----------------------------------------------------------------------------
# 3. Static Files & Root Route
# -----------------------------------------------------------------------------
# Root index.html route
@app.get("/")
async def serve_index():
    index_path = os.path.join(os.path.dirname(__file__), "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return JSONResponse({"status": "SplyGo API running", "docs": "/docs"})

# Mount current directory to serve static assets (styles.css, app.js, images)
app.mount("/", StaticFiles(directory=os.path.dirname(__file__)), name="static")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"🚀 SplyGo server starting at http://localhost:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=True)
