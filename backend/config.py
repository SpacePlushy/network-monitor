"""
Configuration settings for the network monitor backend.
"""

import os

# Server settings
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", 5000))

# CORS settings - allow frontend to connect
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

# Monitoring settings
UPDATE_INTERVAL = 0.1  # seconds between updates
HISTORY_LENGTH = 30  # seconds of bandwidth history to keep

# Connection settings
CLEANUP_STALE_AFTER = 5  # seconds before removing stale connections
