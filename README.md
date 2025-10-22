# Network Monitor

> Real-time network monitoring dashboard for macOS with per-process bandwidth tracking and beautiful visualizations

[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Next.js](https://img.shields.io/badge/next.js-15-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Overview

Network Monitor is a modern, real-time network monitoring application designed specifically for macOS. It provides instant visibility into all active network connections, per-process bandwidth usage, and system-wide network statistics through an elegant dark-themed web dashboard.

### Key Features

- **Real-time Updates**: WebSocket-based updates every 100ms for instant feedback
- **Per-Process Bandwidth**: Track upload and download speeds for each process using macOS `nettop`
- **Live Connection Monitoring**: See all TCP/UDP connections with process names, IPs, ports, and states
- **Interactive Visualizations**: Smooth, responsive bandwidth charts with Apache ECharts
- **Card-Based Interface**: Modern, sortable connection cards with color-coded states
- **Dark Theme**: Beautiful dark UI optimized for extended monitoring sessions
- **Auto-Reconnect**: Resilient WebSocket connection with automatic reconnection

## Screenshots

*Add your screenshots here to showcase the dashboard*

## Technology Stack

### Backend
- **FastAPI** - Modern Python web framework with async support
- **psutil** - Cross-platform library for system and process information
- **nettop** - macOS command-line tool for per-process network statistics
- **uvicorn** - Lightning-fast ASGI server
- **WebSockets** - Real-time bidirectional communication

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Apache ECharts** - Powerful visualization library
- **Lucide React** - Beautiful icon library

## Architecture

```
┌─────────────────┐         WebSocket         ┌──────────────────┐
│                 │ ◄──────────────────────── │                  │
│   Next.js App   │                            │  FastAPI Server  │
│   (Frontend)    │ ───────────────────────► │  (Backend)       │
│   Port 3000     │      REST API Calls        │  Port 5000       │
└─────────────────┘                            └──────────────────┘
                                                        │
                                                        │
                                               ┌────────▼─────────┐
                                               │                  │
                                               │   macOS System   │
                                               │  psutil + nettop │
                                               │                  │
                                               └──────────────────┘
```

## Quick Start

### Prerequisites

- macOS (required for `nettop` support)
- Python 3.8 or higher
- Node.js 18 or higher
- npm or yarn

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/SpacePlushy/network-monitor.git
cd network-monitor

# Setup backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Setup frontend
cd frontend
npm install
cd ..

# Start both servers (requires sudo for nettop access)
./start.sh
```

The script will:
- Request sudo access for packet capture capabilities
- Start the backend on http://127.0.0.1:5000
- Start the frontend on http://localhost:3000
- Open your browser automatically

### Option 2: Manual Setup

#### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run with sudo for full functionality
sudo bash -c "source venv/bin/activate && python main.py"
```

Backend runs on `http://127.0.0.1:5000`

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend runs on `http://localhost:3000`

### Stopping the Application

```bash
./stop.sh
```

This will gracefully shut down both frontend and backend servers.

## Features in Detail

### Real-Time Bandwidth Chart

- **30-second sliding window** showing upload and download speeds
- **300 data points** updated every 100ms for smooth visualization
- **Gradient area fills** for better visual appeal
- **Interactive tooltips** with formatted bandwidth values
- **Auto-scaling Y-axis** with human-readable units (B/s, KB/s, MB/s, GB/s)

### Connection Monitoring

Each connection card displays:

| Field | Description |
|-------|-------------|
| **Process Name** | Name of the application using the connection |
| **PID** | Process identifier |
| **Local Address** | Local IP and port |
| **Remote Address** | Remote IP and port (with reverse DNS when available) |
| **Protocol** | TCP or UDP |
| **State** | Connection state with color coding |
| **Duration** | Time since connection established |
| **Transfer Rate** | Real-time upload/download speeds per connection |

### Connection State Color Coding

- 🟢 **Green** (ESTABLISHED) - Active, established connection
- 🔵 **Blue** (LISTEN) - Server listening for connections
- 🟡 **Yellow** (TIME_WAIT) - Connection in time-wait state
- 🟠 **Orange** (CLOSE_WAIT) - Connection waiting to close
- 🟣 **Purple** (SYN_SENT/SYN_RECV) - TCP handshake in progress
- 🔴 **Red** (FIN_WAIT/CLOSING) - Connection terminating
- ⚫ **Gray** (CLOSED/NONE) - Closed connection

### Sorting Options

Click the sort buttons to organize connections by:
- **Fastest** - Sort by transfer rate (highest first)
- **Process** - Alphabetical by process name
- **Protocol** - Group by TCP/UDP
- **State** - Group by connection state

## API Reference

### REST Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API information and version |
| `/health` | GET | Health check endpoint |
| `/api/connections` | GET | List of all active connections |
| `/api/stats` | GET | Current bandwidth statistics |
| `/api/bandwidth-history` | GET | 30-second bandwidth history |

### WebSocket Endpoint

| Endpoint | Protocol | Description |
|----------|----------|-------------|
| `/ws` | WebSocket | Real-time updates (100ms interval) |

WebSocket message format:
```json
{
  "connections": [...],
  "stats": {
    "upload_speed": 1048576,
    "download_speed": 2097152,
    "active_connections": 15,
    "total_bandwidth": 3145728
  },
  "timestamp": "2024-10-22T15:30:00.000Z"
}
```

## Configuration

### Backend Configuration

Edit `backend/config.py`:

```python
HOST = "127.0.0.1"              # Server host
PORT = 5000                     # Server port
UPDATE_INTERVAL = 0.1           # Update frequency in seconds
HISTORY_LENGTH = 30             # Bandwidth history length in seconds
CORS_ORIGINS = [                # Allowed frontend origins
    "http://localhost:3000",
    "http://localhost:3001",
]
```

### Frontend Configuration

Create `frontend/.env.local` (optional):

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:5000
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:5000
```

## Project Structure

```
network-monitor/
├── README.md                    # This file
├── LICENSE                      # MIT License
├── .gitignore                   # Git ignore rules
├── start.sh                     # Startup script
├── stop.sh                      # Shutdown script
│
├── backend/                     # Python FastAPI backend
│   ├── main.py                 # FastAPI application
│   ├── network_monitor.py      # Network monitoring logic
│   ├── config.py               # Configuration settings
│   ├── requirements.txt        # Python dependencies
│   └── README.md               # Backend documentation
│
└── frontend/                    # Next.js frontend
    ├── app/
    │   ├── page.tsx            # Main dashboard page
    │   ├── layout.tsx          # Root layout with dark theme
    │   └── globals.css         # Global styles
    ├── components/
    │   ├── BandwidthChart.tsx  # ECharts bandwidth visualization
    │   ├── ConnectionTable.tsx # Connection cards with sorting
    │   └── StatsCards.tsx      # Statistics overview cards
    ├── hooks/
    │   └── useWebSocket.ts     # WebSocket management hook
    ├── lib/
    │   ├── api.ts              # API client utilities
    │   └── utils.ts            # Helper functions
    ├── types/
    │   └── index.ts            # TypeScript type definitions
    ├── package.json            # Node dependencies
    ├── tsconfig.json           # TypeScript configuration
    ├── tailwind.config.ts      # Tailwind CSS configuration
    └── next.config.ts          # Next.js configuration
```

## Development

### Backend Development

```bash
cd backend
source venv/bin/activate

# Run with auto-reload (without sudo for development)
python main.py

# Or with uvicorn directly
uvicorn main:app --reload --host 127.0.0.1 --port 5000

# View API documentation
open http://127.0.0.1:5000/docs
```

### Frontend Development

```bash
cd frontend

# Development mode with hot reload
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Production build
npm run build
```

## Testing

### Backend Testing

```bash
# Test health endpoint
curl http://127.0.0.1:5000/health

# Get current connections
curl http://127.0.0.1:5000/api/connections | jq

# Get bandwidth statistics
curl http://127.0.0.1:5000/api/stats | jq

# Get bandwidth history
curl http://127.0.0.1:5000/api/bandwidth-history | jq
```

### WebSocket Testing

```python
import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://127.0.0.1:5000/ws"
    async with websockets.connect(uri) as websocket:
        # Receive 5 updates
        for i in range(5):
            message = await websocket.recv()
            data = json.loads(message)
            print(f"Update {i+1}:")
            print(f"  Connections: {len(data['connections'])}")
            print(f"  Upload: {data['stats']['upload_speed']} B/s")
            print(f"  Download: {data['stats']['download_speed']} B/s")

asyncio.run(test_websocket())
```

## Performance

| Component | Metric | Value |
|-----------|--------|-------|
| Backend CPU | Average | < 3% |
| Backend Memory | Average | ~80 MB |
| Frontend CPU | Idle | < 1% |
| Frontend CPU | Active | ~3% |
| Frontend Memory | Average | ~120 MB |
| Update Frequency | WebSocket | 100 ms (10 updates/sec) |
| Data Window | Chart | 30 seconds |
| Network Usage | WebSocket | Minimal (~10 KB/s) |

## Troubleshooting

### Backend Issues

**"Address already in use" error**
```bash
# Check what's using port 5000
lsof -i :5000

# Kill the process or change PORT in config.py
```

**"Permission denied" for nettop**
```bash
# Run backend with sudo for full functionality
sudo bash -c "source venv/bin/activate && python main.py"
```

**No bandwidth data showing**
```bash
# Ensure nettop is available (macOS only)
which nettop

# Run with sudo to access nettop
sudo ./start.sh
```

### Frontend Issues

**"Failed to connect to WebSocket"**
- Verify backend is running on port 5000
- Check firewall settings
- Ensure CORS is configured correctly in `backend/config.py`

**"Cannot connect to http://127.0.0.1:5000"**
- Backend must be started before frontend
- Check that backend is running: `curl http://127.0.0.1:5000/health`

**Chart not updating**
- Check browser console for WebSocket errors
- Verify real-time data is being received
- Clear browser cache and reload

## Known Limitations

1. **macOS Only**: Per-process bandwidth tracking requires macOS `nettop` utility
2. **Sudo Required**: Full functionality requires elevated privileges for packet capture
3. **Local Only**: Designed for monitoring the local machine, not remote systems
4. **IPv4 Focus**: Optimized for IPv4; IPv6 support may vary

## Future Enhancements

- [ ] Historical data persistence with SQLite
- [ ] Export functionality (CSV/JSON)
- [ ] Custom alerts and notifications
- [ ] Process filtering and search
- [ ] Per-application bandwidth charts
- [ ] Support for Linux (using alternative to nettop)
- [ ] Docker containerization
- [ ] System resource monitoring (CPU, memory)
- [ ] Network packet inspection
- [ ] Geographic IP location visualization

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- Powered by [Next.js](https://nextjs.org/)
- Visualizations by [Apache ECharts](https://echarts.apache.org/)
- Icons from [Lucide](https://lucide.dev/)
- Network monitoring via [psutil](https://github.com/giampaolo/psutil)

## Author

**SpacePlushy**
- GitHub: [@SpacePlushy](https://github.com/SpacePlushy)
- Email: fmp21994@gmail.com

---

⭐ If you found this project helpful, please consider giving it a star!
