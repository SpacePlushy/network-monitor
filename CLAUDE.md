# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Network Monitor is a real-time network monitoring application for macOS. It consists of a FastAPI backend that collects network data and a Next.js 15 frontend that displays it with live updates via WebSocket.

## Essential Commands

### Initial Setup
```bash
# Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Frontend setup
cd frontend
npm install
cd ..
```

### Running the Application
```bash
# Start both servers (requires sudo for nettop)
./start.sh

# Stop both servers
./stop.sh

# Manual backend start (from backend/ directory)
sudo bash -c "source venv/bin/activate && python main.py"

# Manual frontend start (from frontend/ directory)
npm run dev
```

### Development Commands
```bash
# Backend
cd backend
source venv/bin/activate
python main.py                    # Run without sudo (limited functionality)
# View API docs at http://127.0.0.1:5000/docs

# Frontend
cd frontend
npm run dev                       # Development server with hot reload
npm run build                     # Production build
npm run lint                      # Run ESLint
```

### Testing/Debugging
```bash
# Test backend endpoints
curl http://127.0.0.1:5000/health
curl http://127.0.0.1:5000/api/connections | jq
curl http://127.0.0.1:5000/api/stats | jq

# View logs
tail -f backend/backend.log
tail -f frontend/frontend.log

# Check ports
lsof -i :5000    # Backend
lsof -i :3000    # Frontend
```

## Architecture Overview

### Data Flow (Critical Understanding)

1. **Backend Monitoring Loop** ([backend/main.py:26-55](backend/main.py#L26-L55))
   - Async background task runs every 100ms (configurable via [backend/config.py:20](backend/config.py#L20))
   - Calls `monitor.update()` to collect fresh network data
   - Broadcasts data to all connected WebSocket clients
   - Lives in the FastAPI app lifespan context

2. **Network Data Collection** ([backend/network_monitor.py](backend/network_monitor.py))
   - Uses `psutil.net_connections()` to get active connections (requires elevated privileges)
   - Uses macOS `nettop` command to get per-process bandwidth (lines 117-194)
   - Calculates bandwidth rates by comparing byte counters between updates (delta calculation)
   - Maintains connection state in dictionary with unique IDs

3. **WebSocket Communication** ([backend/main.py:146-189](backend/main.py#L146-L189))
   - Client connects to `/ws` endpoint
   - Receives initial data immediately on connection
   - Continuously receives updates from background monitoring task
   - Auto-reconnect handled on frontend

4. **Frontend Real-Time Updates** ([frontend/hooks/useWebSocket.ts](frontend/hooks/useWebSocket.ts))
   - Custom hook manages WebSocket connection lifecycle
   - Auto-reconnect with exponential backoff (configurable attempts)
   - Parses incoming messages and updates React state
   - Provides connection status to components

5. **Chart Visualization** ([frontend/components/BandwidthChart.tsx](frontend/components/BandwidthChart.tsx))
   - **CRITICAL**: Chart initializes with 300 pre-populated zero data points (lines 28-33)
   - This prevents data "piling up" on the left during startup
   - Implements sliding window: shift() old data when exceeding MAX_DATA_POINTS (lines 209-213)
   - Uses Apache ECharts with deep cloning for immutable updates
   - 300 points × 100ms interval = 30-second window

### Key Technical Details

**macOS Dependency - nettop:**
- The `nettop` command is macOS-only and provides per-process network statistics
- Requires sudo privileges for packet capture functionality
- Called with flags: `-P` (process mode), `-L 1` (one iteration), `-J bytes_in,bytes_out` (specific columns)
- Parsing logic in [backend/network_monitor.py:117-194](backend/network_monitor.py#L117-L194)
- Gracefully degrades if not available (connections still work, bandwidth may be limited)

**Bandwidth Rate Calculation:**
- Backend stores previous byte counters for each process
- On each update, calculates delta: `(current_bytes - previous_bytes) / time_delta`
- Avoids negative deltas (can occur when process restarts) by using `max(0, delta)`
- Total bandwidth is sum of all per-process bandwidths from nettop

**WebSocket Message Format:**
```json
{
  "type": "initial" | "update" | "pong",
  "data": {
    "connections": [...],
    "stats": {
      "total_upload_speed": 0,
      "total_download_speed": 0,
      "active_connections": 0,
      "total_bytes_sent": 0,
      "total_bytes_received": 0,
      "uptime": 0
    }
  }
}
```

**Connection Tracking:**
- Connections identified by composite key: `{protocol}_{local_addr}_{remote_addr}_{pid}`
- Duration calculated from stored `start_time` for each connection
- Connections without remote address (listening sockets) are filtered out
- State management in [backend/network_monitor.py:229-265](backend/network_monitor.py#L229-L265)

**Frontend Type Safety:**
- All data structures defined in [frontend/types/index.ts](frontend/types/index.ts)
- Backend Python types mirror frontend TypeScript types for consistency
- Use these types when adding new features to maintain type safety

## Configuration

**Backend** - [backend/config.py](backend/config.py):
- `HOST`: Server bind address (default: 127.0.0.1)
- `PORT`: Server port (default: 5000)
- `UPDATE_INTERVAL`: Seconds between updates (default: 0.1)
- `HISTORY_LENGTH`: Seconds of bandwidth history (default: 30)
- `CORS_ORIGINS`: Allowed frontend origins for CORS

**Frontend** - Create `frontend/.env.local` if needed:
- `NEXT_PUBLIC_API_URL`: Backend REST API URL (default: http://127.0.0.1:5000)
- `NEXT_PUBLIC_WS_URL`: Backend WebSocket URL (default: ws://127.0.0.1:5000)

## Common Development Tasks

### Adding a New Backend Endpoint

1. Add route function to [backend/main.py](backend/main.py)
2. Use the `monitor` instance to access network data
3. Follow existing patterns for async handlers
4. Update frontend API client in [frontend/lib/api.ts](frontend/lib/api.ts) if needed

### Modifying Update Frequency

Change `UPDATE_INTERVAL` in [backend/config.py:20](backend/config.py#L20). Note:
- Also update `MAX_DATA_POINTS` in [frontend/components/BandwidthChart.tsx:20](frontend/components/BandwidthChart.tsx#L20) if needed
- Formula: `MAX_DATA_POINTS = WINDOW_SECONDS / UPDATE_INTERVAL`
- Example: 30 seconds ÷ 0.1 seconds = 300 points

### Changing Chart Window Duration

1. Calculate new `MAX_DATA_POINTS`: `desired_seconds / UPDATE_INTERVAL`
2. Update constant in [frontend/components/BandwidthChart.tsx:20](frontend/components/BandwidthChart.tsx#L20)
3. Update initialization loop interval in line 29: `now.getTime() - i * (UPDATE_INTERVAL * 1000)`
4. Update display text in line 223 if needed

### Working with Chart Library (Apache ECharts)

- **IMPORTANT**: Always deep clone the option object before modifying (line 196)
- Use `notMerge={false}` and `lazyUpdate={true}` for performance (lines 230-231)
- Custom tooltip formatting in lines 45-59
- Area gradient styling in lines 136-147 (download) and 169-174 (upload)
- Y-axis uses custom formatter for human-readable bandwidth units (line 115)

### Debugging WebSocket Issues

1. Check backend logs: `tail -f backend/backend.log`
2. Check browser console for connection errors
3. Verify CORS configuration in [backend/config.py:12-17](backend/config.py#L12-L17)
4. Check WebSocket connection count in backend: `curl http://127.0.0.1:5000/health`
5. Verify auto-reconnect parameters in [frontend/hooks/useWebSocket.ts:22-24](frontend/hooks/useWebSocket.ts#L22-L24)

## Important Constraints

1. **macOS Only**: The `nettop` command is macOS-specific. Porting to Linux/Windows requires alternative approach (e.g., using nethogs, iftop, or similar tools)

2. **Sudo Required**: Full functionality (per-process bandwidth) requires running backend with sudo for packet capture access

3. **Port Requirements**: Backend needs port 5000, frontend needs port 3000. Both must be free before starting

4. **Python Version**: Requires Python 3.8+ for asyncio features used in FastAPI

5. **Next.js 15**: Uses App Router (not Pages Router). Components must be marked 'use client' for hooks/state

## Process Management

The [start.sh](start.sh) and [stop.sh](stop.sh) scripts manage both servers:
- PIDs stored in `.backend.pid` and `.frontend.pid` files (gitignored)
- Backend runs with sudo, frontend runs as normal user
- Logs written to `backend/backend.log` and `frontend/frontend.log`
- Port cleanup on stop to prevent "address already in use" errors
- Dynamic waiting for services to start with timeouts

## Code Style Notes

- Backend: Python with type hints where practical, async/await for I/O
- Frontend: TypeScript strict mode, functional components with hooks
- Consistent dark theme: gray-900 (background), gray-800 (cards), gray-700 (borders)
- Color-coded connection states (see [frontend/components/ConnectionTable.tsx](frontend/components/ConnectionTable.tsx))
