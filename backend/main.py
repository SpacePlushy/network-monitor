"""
FastAPI backend for network monitor.
Provides REST API endpoints and WebSocket for real-time updates.
"""

import asyncio
import json
import logging
from typing import Set
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

import config
from network_monitor import NetworkMonitor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global network monitor instance
monitor = NetworkMonitor()

# Track active WebSocket connections
active_connections: Set[WebSocket] = set()

# Background monitoring task
monitoring_task = None


async def broadcast_to_client(ws: WebSocket, message: str):
    """Send message to a single WebSocket client."""
    try:
        await ws.send_text(message)
        return None
    except Exception as e:
        logger.debug(f"Failed to send to client: {e}")
        return ws  # Return failed connection


async def monitor_network():
    """Background task to continuously monitor network and broadcast updates."""
    while True:
        try:
            # Update network statistics
            data = monitor.update()

            # Broadcast to all connected WebSocket clients concurrently
            if active_connections:
                message = json.dumps({
                    'type': 'update',
                    'data': data
                })

                # Send to all connections concurrently for better performance
                results = await asyncio.gather(
                    *(broadcast_to_client(ws, message) for ws in active_connections),
                    return_exceptions=True
                )

                # Remove failed connections
                failed = {r for r in results if isinstance(r, WebSocket)}
                if failed:
                    active_connections.difference_update(failed)
                    logger.info(f"Removed {len(failed)} disconnected client(s)")

            # Wait before next update
            await asyncio.sleep(config.UPDATE_INTERVAL)
        except Exception as e:
            logger.error(f"Error in monitoring task: {e}", exc_info=True)
            await asyncio.sleep(config.UPDATE_INTERVAL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan - start/stop monitoring task."""
    # Startup: Start background monitoring task
    global monitoring_task
    monitoring_task = asyncio.create_task(monitor_network())
    logger.info(f"Network monitoring started - updating every {config.UPDATE_INTERVAL}s")

    yield

    # Shutdown: Cancel monitoring task
    if monitoring_task:
        monitoring_task.cancel()
        try:
            await monitoring_task
        except asyncio.CancelledError:
            pass
    logger.info("Network monitoring stopped")


# Create FastAPI app with lifespan management
app = FastAPI(
    title="Network Monitor API",
    description="Real-time network connection and bandwidth monitoring",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# REST API Endpoints

@app.get("/")
async def root():
    """Root endpoint - API info."""
    return {
        "name": "Network Monitor API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "active_connections": len(active_connections),
        "uptime": monitor.get_stats()["uptime"]
    }


@app.get("/api/connections")
async def get_connections():
    """Get all active network connections."""
    connections = monitor.get_connections()
    return {
        "connections": connections,
        "count": len(connections)
    }


@app.get("/api/stats")
async def get_stats():
    """Get overall bandwidth statistics."""
    return monitor.get_stats()


# WebSocket Endpoint

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time updates.
    Clients connect here to receive continuous network updates.
    """
    await websocket.accept()
    active_connections.add(websocket)

    logger.info(f"WebSocket client connected. Total clients: {len(active_connections)}")

    try:
        # Send initial data immediately
        data = monitor.update()
        await websocket.send_text(json.dumps({
            'type': 'initial',
            'data': data
        }))

        # Keep connection alive and handle incoming messages
        while True:
            # Wait for messages from client with timeout (non-blocking)
            try:
                message = await asyncio.wait_for(websocket.receive_text(), timeout=60.0)
                # Handle client messages if needed
                data = json.loads(message)
                if data.get('type') == 'ping':
                    await websocket.send_text(json.dumps({'type': 'pong'}))
            except asyncio.TimeoutError:
                # No message received, just continue keeping connection alive
                continue
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError as e:
                logger.warning(f"Invalid JSON from client: {e}")
                continue
            except ConnectionError as e:
                logger.error(f"Connection error: {e}")
                break
            except Exception as e:
                logger.error(f"Unexpected WebSocket error: {e}", exc_info=True)
                break

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected normally")
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}", exc_info=True)
    finally:
        active_connections.discard(websocket)
        logger.info(f"WebSocket client removed. Total clients: {len(active_connections)}")


if __name__ == "__main__":
    import uvicorn

    logger.info(f"Starting Network Monitor API on {config.HOST}:{config.PORT}")
    logger.info(f"API documentation available at http://{config.HOST}:{config.PORT}/docs")

    uvicorn.run(
        "main:app",
        host=config.HOST,
        port=config.PORT,
        reload=True,
        log_level="info"
    )
