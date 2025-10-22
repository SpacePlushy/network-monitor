# Product Requirements Document: Local Network Monitor

## 1. Overview
Build a network monitoring application that displays real-time network connections, transfer speeds, and bandwidth usage for a Mac computer. The application will use Python for backend data collection and Next.js for a modern web-based UI accessible via localhost.

## 2. Goals
- Monitor all active network connections on the user's Mac
- Display real-time upload/download speeds
- Show which applications/processes are using the network
- Provide an intuitive, modern dashboard interface
- Operate entirely locally without external dependencies

## 3. Target User
Technical user who wants to monitor their Mac's network activity to:
- See what their computer is accessing on the local network
- Monitor transfer speeds for active connections
- Identify which applications are using bandwidth
- Troubleshoot network issues

## 4. Core Features

### 4.1 Network Connection Monitoring
- Display all active network connections (TCP/UDP)
- Show for each connection:
  - Source IP and port
  - Destination IP and port
  - Protocol (TCP/UDP)
  - Connection state (ESTABLISHED, LISTENING, TIME_WAIT, etc.)
  - Process name and PID using the connection
  - Duration of connection

### 4.2 Bandwidth Monitoring
- Real-time upload speed (current)
- Real-time download speed (current)
- Total data sent/received per connection
- Total system bandwidth usage
- Historical bandwidth graphs (last 60 seconds minimum)

### 4.3 Process Information
- Application name for each connection
- Process ID (PID)
- Ability to filter/group connections by application
- Icon or identifier for known applications

### 4.4 Filtering and Search
- Filter by:
  - Application/process name
  - Protocol type
  - Connection state
  - Local vs remote connections
- Search by IP address or port
- Option to hide/show specific connection types

### 4.5 Dashboard Views
- Overview dashboard with key metrics
- Detailed connection table view
- Bandwidth graphs and visualization
- Per-application bandwidth usage

## 5. Technical Stack

### Backend
- **Language**: Python 3.8+
- **Framework**: Flask or FastAPI
- **Key Libraries**:
  - `psutil` - Network and process information
  - `flask-socketio` or `fastapi-websocket` - Real-time updates
  - `flask-cors` or similar - CORS handling for Next.js
- **Port**: 5000 (or configurable)
- **Purpose**: API server for network data collection

### Frontend
- **Framework**: Next.js 14+ (React)
- **Language**: TypeScript (preferred) or JavaScript
- **Key Libraries**:
  - React hooks for state management
  - Socket.io-client or native WebSocket - Real-time updates
  - Chart.js, Recharts, or similar - Bandwidth visualization
  - Tailwind CSS - Styling
  - Lucide React or similar - Icons
- **Port**: 3000 (default Next.js port)
- **Purpose**: User interface and data presentation

### Communication
- REST API endpoints for initial data and commands
- WebSocket connection for real-time updates
- CORS configured to allow localhost:3000 to access localhost:5000

## 6. User Interface Requirements

### 6.1 Layout
- Clean, modern dashboard design
- Header with app title and key stats (total up/down speed)
- Sidebar or tabs for navigation between views
- Main content area for connection table or graphs
- Fully responsive design

### 6.2 Connection Table
- Sortable columns (by speed, process name, IP, etc.)
- Color coding for connection states
- Hover effects for additional details
- Pagination for large connection lists
- Auto-refresh with smooth transitions

### 6.3 Bandwidth Graphs
- Real-time line chart showing upload/download over time
- Update smoothly every 1-2 seconds
- Animated transitions
- Clear axis labels with auto-scaling units (KB/s, MB/s, GB/s)
- Tooltip on hover showing exact values

### 6.4 Dashboard Components
- Summary cards showing:
  - Current upload speed
  - Current download speed
  - Active connections count
  - Top bandwidth-consuming application
- Live updating without page reload

### 6.5 Controls
- Start/Stop monitoring toggle
- Refresh rate selector
- Filter controls with modern UI components
- Clear statistics button
- Search bar with instant filtering

## 7. Non-Functional Requirements

### 7.1 Performance
- Backend: Minimal CPU usage (<5% on average)
- Backend: Low memory footprint (<100MB)
- Frontend: Smooth 60fps UI updates
- Data updates every 1-2 seconds without lag
- Handle 100+ active connections without performance degradation

### 7.2 Usability
- Start backend: `python app.py` or `uvicorn main:app`
- Start frontend: `npm run dev`
- Clear setup instructions in README
- Graceful error messages if backend unavailable
- Loading states while fetching data

### 7.3 Reliability
- Handle backend disconnections gracefully
- Reconnect WebSocket automatically if dropped
- Don't crash if monitored process terminates
- Display error states clearly to user
- Safe to run continuously

### 7.4 Security
- Backend only accessible from localhost (127.0.0.1)
- Frontend only accessible from localhost
- CORS restricted to localhost origins
- No data sent to external servers
- No logging of sensitive information

## 8. API Design

### 8.1 REST Endpoints

**GET /api/connections**
- Returns current list of all network connections
- Response format:
```json
{
  "connections": [
    {
      "id": "unique-id",
      "local_addr": "192.168.1.100:54321",
      "remote_addr": "93.184.216.34:443",
      "protocol": "TCP",
      "state": "ESTABLISHED",
      "process_name": "Chrome",
      "pid": 1234,
      "upload_speed": 125000,
      "download_speed": 450000,
      "duration": 45
    }
  ]
}
```

**GET /api/stats**
- Returns overall bandwidth statistics
- Response format:
```json
{
  "total_upload_speed": 1250000,
  "total_download_speed": 4500000,
  "active_connections": 42,
  "total_bytes_sent": 123456789,
  "total_bytes_received": 987654321,
  "uptime": 3600
}
```

**GET /api/bandwidth-history**
- Returns last 60 seconds of bandwidth data
- Response format:
```json
{
  "history": [
    {
      "timestamp": 1699900000,
      "upload": 125000,
      "download": 450000
    }
  ]
}
```

**POST /api/control**
- Start/stop monitoring
- Body: `{ "action": "start" | "stop" }`

### 8.2 WebSocket Events

**Server → Client:**
- `connection_update` - New connection data
- `stats_update` - Updated bandwidth stats
- `bandwidth_data` - New bandwidth history point
- `connection_closed` - Connection terminated

**Client → Server:**
- `subscribe` - Start receiving updates
- `unsubscribe` - Stop receiving updates

## 9. Data Requirements

### 9.1 Data Collection (Backend)
- Poll network statistics every 1 second
- Calculate speeds based on byte deltas
- Maintain 60-second rolling history
- Track per-connection cumulative statistics
- Clean up stale connections

### 9.2 Data Display (Frontend)
- Format bytes appropriately (B, KB, MB, GB)
- Format speeds as X/s (e.g., 1.5 MB/s)
- Show connection duration in human-readable format
- Display timestamps in user's local timezone
- Use color coding for different states

## 10. Out of Scope (Phase 1)

The following features are not required for initial version:
- Deep packet inspection
- Packet capture (pcap)
- Historical data persistence (database)
- Alerts/notifications
- Firewall capabilities
- Blocking connections
- Monitoring other devices on network
- Mobile app version
- Export data to files
- User authentication

## 11. Success Criteria

The application is successful if:
- User can see all active network connections on their Mac
- Real-time bandwidth speeds are accurate and update smoothly
- User can identify which applications are using the network
- The interface is modern, intuitive, and responsive
- Application runs reliably without crashes
- Performance impact on system is minimal
- Setup process is straightforward

## 12. Installation & Setup

### 12.1 Prerequisites
- Python 3.8 or higher
- Node.js 18+ and npm
- macOS (primary target platform)

### 12.2 Backend Setup
1. Navigate to backend directory
2. Create virtual environment: `python -m venv venv`
3. Activate: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Run server: `python app.py` or `uvicorn main:app --reload`

### 12.3 Frontend Setup
1. Navigate to frontend directory
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`
4. Open browser to `http://localhost:3000`

### 12.4 Backend Dependencies (requirements.txt)
```
flask>=3.0.0
flask-socketio>=5.3.0
flask-cors>=4.0.0
psutil>=5.9.0
python-socketio>=5.10.0
```

OR for FastAPI:
```
fastapi>=0.104.0
uvicorn>=0.24.0
websockets>=12.0
psutil>=5.9.0
python-socketio>=5.10.0
```

### 12.5 Frontend Dependencies (package.json)
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "socket.io-client": "^4.6.0",
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0",
    "lucide-react": "^0.300.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

## 13. Development Phases

### Phase 1: Core Backend (MVP)
- Python API server with psutil integration
- REST endpoints for connections and stats
- Basic WebSocket for real-time updates
- CORS configuration

### Phase 2: Core Frontend (MVP)
- Next.js project setup with TypeScript
- Connection table component
- Real-time data fetching
- WebSocket integration
- Basic styling with Tailwind

### Phase 3: Enhanced UI
- Bandwidth graphs with Chart.js
- Dashboard overview cards
- Filtering and search functionality
- Improved styling and animations
- Loading and error states

### Phase 4: Polish
- Performance optimization
- Error handling improvements
- Comprehensive documentation
- Better visual design
- Responsive design refinement

## 14. Project Structure

```
network-monitor/
├── backend/
│   ├── app.py              # Flask main application
│   ├── requirements.txt    # Python dependencies
│   ├── config.py           # Configuration
│   ├── network_monitor.py  # Network data collection logic
│   └── README.md           # Backend setup instructions
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           # Main dashboard page
│   │   │   ├── layout.tsx         # Root layout
│   │   │   └── globals.css        # Global styles
│   │   ├── components/
│   │   │   ├── ConnectionTable.tsx
│   │   │   ├── BandwidthChart.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   └── FilterControls.tsx
│   │   ├── hooks/
│   │   │   ├── useConnections.ts
│   │   │   └── useWebSocket.ts
│   │   ├── lib/
│   │   │   ├── api.ts             # API client
│   │   │   └── utils.ts           # Utility functions
│   │   └── types/
│   │       └── index.ts           # TypeScript types
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── README.md           # Frontend setup instructions
│
└── README.md               # Main project README
```

## 15. Technical Considerations

### 15.1 Permissions
- Standard user permissions should work for most features
- Document if elevated privileges needed
- Gracefully handle permission errors

### 15.2 Cross-Origin Communication
- Backend must enable CORS for localhost:3000
- WebSocket must accept connections from Next.js dev server
- Production build should use environment variables for API URL

### 15.3 State Management
- Use React hooks (useState, useEffect) for local state
- Consider React Context for global state if needed
- WebSocket connection should be managed at app level

### 15.4 Error Handling
- Backend: Return proper HTTP status codes and error messages
- Frontend: Display user-friendly error messages
- Handle network errors gracefully
- Show "Backend unavailable" state if API unreachable

## 16. Future Enhancements (Post-MVP)

- Save monitoring sessions to database
- Historical data analysis and reports
- Alert system for bandwidth thresholds
- Dark mode toggle
- Export data to CSV/JSON
- Packet-level inspection (with elevated permissions)
- Multi-device monitoring
- Docker containerization
- Electron wrapper for standalone app
