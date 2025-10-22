# Network Monitor Backend

FastAPI backend for monitoring network connections and bandwidth usage on macOS.

## Features

- Real-time network connection monitoring using `psutil`
- REST API endpoints for connections, stats, and bandwidth history
- WebSocket support for live updates
- CORS-enabled for frontend integration
- Automatic bandwidth history tracking (60 seconds)

## Prerequisites

- Python 3.8 or higher
- macOS (primary target platform)

## Installation

1. **Create and activate a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## Running the Server

### Development Mode (with auto-reload)

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 5000
```

The server will start on `http://127.0.0.1:5000`

### API Documentation

Once running, visit:
- Interactive API docs: `http://127.0.0.1:5000/docs`
- Alternative API docs: `http://127.0.0.1:5000/redoc`

## API Endpoints

### REST Endpoints

#### `GET /`
Root endpoint with API information.

#### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "active_connections": 2,
  "uptime": 123.45
}
```

#### `GET /api/connections`
Get all active network connections.

**Response:**
```json
{
  "connections": [
    {
      "id": "TCP_192.168.1.100:54321_93.184.216.34:443_1234",
      "local_addr": "192.168.1.100:54321",
      "remote_addr": "93.184.216.34:443",
      "protocol": "SOCK_STREAM",
      "state": "ESTABLISHED",
      "process_name": "Google Chrome",
      "pid": 1234,
      "upload_speed": 0,
      "download_speed": 0,
      "duration": 45.2,
      "bytes_sent": 0,
      "bytes_received": 0
    }
  ],
  "count": 1
}
```

#### `GET /api/stats`
Get overall bandwidth statistics.

**Response:**
```json
{
  "total_upload_speed": 125000.5,
  "total_download_speed": 450000.2,
  "active_connections": 15,
  "total_bytes_sent": 123456789,
  "total_bytes_received": 987654321,
  "uptime": 3600.5
}
```

#### `GET /api/bandwidth-history`
Get bandwidth history for the last 60 seconds.

**Response:**
```json
{
  "history": [
    {
      "timestamp": 1699900000.123,
      "upload": 125000.5,
      "download": 450000.2
    }
  ],
  "count": 60
}
```

### WebSocket Endpoint

#### `WS /ws`
WebSocket endpoint for real-time updates.

**Connection:**
```javascript
const ws = new WebSocket('ws://127.0.0.1:5000/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

**Message Types:**

1. **Initial Data** (sent on connect):
```json
{
  "type": "initial",
  "data": {
    "connections": [...],
    "stats": {...}
  }
}
```

2. **Updates** (sent every 1 second):
```json
{
  "type": "update",
  "data": {
    "connections": [...],
    "stats": {...}
  }
}
```

3. **Ping/Pong** (keepalive):
Send: `{"type": "ping"}`
Receive: `{"type": "pong"}`

## Testing

### Test with curl

```bash
# Health check
curl http://127.0.0.1:5000/health

# Get connections
curl http://127.0.0.1:5000/api/connections

# Get stats
curl http://127.0.0.1:5000/api/stats

# Get bandwidth history
curl http://127.0.0.1:5000/api/bandwidth-history
```

### Test WebSocket with Python

```python
import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://127.0.0.1:5000/ws"
    async with websockets.connect(uri) as websocket:
        # Receive initial data
        message = await websocket.recv()
        data = json.loads(message)
        print(f"Initial data: {data['type']}")

        # Receive updates
        for i in range(5):
            message = await websocket.recv()
            data = json.loads(message)
            print(f"Update {i+1}: {len(data['data']['connections'])} connections")

asyncio.run(test_websocket())
```

## Configuration

Edit `config.py` to change:

- `HOST`: Server host (default: 127.0.0.1)
- `PORT`: Server port (default: 5000)
- `UPDATE_INTERVAL`: Seconds between updates (default: 1.0)
- `HISTORY_LENGTH`: Seconds of bandwidth history (default: 60)
- `CORS_ORIGINS`: Allowed origins for CORS

## Architecture

```
backend/
├── main.py              # FastAPI application & endpoints
├── network_monitor.py   # Network monitoring logic with psutil
├── config.py            # Configuration settings
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

## Notes

- **Per-connection bandwidth**: Currently set to 0 as accurate per-connection speeds require packet capture (libpcap). The overall system bandwidth is accurately tracked.
- **Permissions**: Standard user permissions work for most features. Some connection details may require elevated privileges.
- **Platform**: Primarily tested on macOS. May work on Linux with minor adjustments.

## Troubleshooting

### "Address already in use" error
Port 5000 is already taken. Either:
- Stop the other process using port 5000
- Change the PORT in `config.py`

### "Permission denied" errors
Some network operations may require elevated privileges:
```bash
sudo python main.py
```

### High CPU usage
If CPU usage is too high, increase `UPDATE_INTERVAL` in `config.py` (e.g., to 2.0 seconds).
