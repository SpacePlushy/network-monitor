# Network Monitor Frontend

Modern Next.js dashboard for visualizing real-time network connections and bandwidth usage.

## Features

- **Real-time Updates**: WebSocket connection for live data streaming
- **Stats Dashboard**: Overview cards showing upload/download speeds and active connections
- **Bandwidth Chart**: Interactive Chart.js graph showing bandwidth over time
- **Connection Table**: Sortable table displaying all active network connections
- **Auto-reconnect**: Automatic WebSocket reconnection with visual status indicator
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Chart.js** - Interactive bandwidth charts
- **Lucide React** - Beautiful icons
- **WebSocket** - Real-time data updates

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Running backend server (see `backend/README.md`)

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure API URL (optional):**

   By default, the frontend connects to `http://127.0.0.1:5000`. To change this, create a `.env.local` file:
   ```bash
   NEXT_PUBLIC_API_URL=http://127.0.0.1:5000
   ```

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will start on `http://localhost:3000`

### Production Build

```bash
npm run build
npm run start
```

### Linting

```bash
npm run lint
```

## Project Structure

```
frontend/
├── app/
│   ├── page.tsx           # Main dashboard page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles with Tailwind
├── components/
│   ├── StatsCards.tsx     # Stats overview cards
│   ├── ConnectionTable.tsx # Sortable connections table
│   └── BandwidthChart.tsx  # Real-time bandwidth chart
├── hooks/
│   └── useWebSocket.ts    # WebSocket hook with auto-reconnect
├── lib/
│   ├── api.ts            # REST API client
│   └── utils.ts          # Utility functions (formatting, etc.)
├── types/
│   └── index.ts          # TypeScript type definitions
└── package.json
```

## Components

### StatsCards

Displays key metrics in card format:
- Upload speed with total bytes sent
- Download speed with total bytes received
- Active connections count
- Combined bandwidth usage

### ConnectionTable

Sortable table showing all active connections with:
- Process name and PID
- Local and remote addresses
- Protocol type
- Connection state (with color coding)
- Duration

**Features:**
- Click column headers to sort
- Hover effects for better UX
- Empty state with helpful message

### BandwidthChart

Line chart showing real-time bandwidth over the last 60 seconds:
- Upload speed (green line)
- Download speed (blue line)
- Smooth animations
- Formatted tooltips
- Auto-scaling Y-axis

### useWebSocket Hook

Custom React hook managing WebSocket connection:
- Automatic connection on mount
- Auto-reconnect with exponential backoff
- Connection status tracking
- Real-time data updates
- Proper cleanup on unmount

## API Integration

The frontend communicates with the backend via:

### REST Endpoints

Used for initial data loading:
- `GET /api/connections` - Get all connections
- `GET /api/stats` - Get bandwidth statistics
- `GET /api/bandwidth-history` - Get 60s history
- `GET /health` - Health check

### WebSocket

Real-time updates via `ws://127.0.0.1:5000/ws`:
- Receives `initial` message on connection
- Receives `update` messages every 1 second
- Supports ping/pong for keepalive

## Utility Functions

Located in `lib/utils.ts`:

- `formatBytes(bytes)` - Format bytes to KB/MB/GB
- `formatSpeed(bytesPerSecond)` - Format speed with /s
- `formatDuration(seconds)` - Format duration (e.g., "1h 23m")
- `formatTime(timestamp)` - Format Unix timestamp
- `getStateColor(state)` - Get Tailwind color for connection state
- `getStateBadgeColor(state)` - Get badge color for state

## Styling

The app uses Tailwind CSS with:
- Custom color scheme (blue primary)
- Responsive breakpoints
- Hover effects and transitions
- Card-based layouts
- Dark mode support (via CSS variables)

### Color Scheme

Connection states are color-coded:
- **Green**: ESTABLISHED (active connection)
- **Blue**: LISTEN (server listening)
- **Yellow**: TIME_WAIT (closing)
- **Orange**: CLOSE_WAIT (half-closed)
- **Purple**: SYN_SENT/SYN_RECV (handshake)
- **Red**: FIN_WAIT/CLOSING (terminating)
- **Gray**: CLOSED

## Troubleshooting

### "Failed to fetch" errors

**Issue**: Frontend can't connect to backend

**Solutions**:
1. Ensure backend is running: `python backend/main.py`
2. Check backend is on `http://127.0.0.1:5000`
3. Verify CORS is configured correctly in backend
4. Check browser console for detailed errors

### WebSocket connection fails

**Issue**: Real-time updates not working

**Solutions**:
1. Check backend WebSocket endpoint is accessible
2. Look for firewall blocking WebSocket connections
3. Check browser console for WebSocket errors
4. Verify backend is running with WebSocket support

### Chart not rendering

**Issue**: Bandwidth chart is blank or has errors

**Solutions**:
1. Ensure Chart.js is installed: `npm install chart.js react-chartjs-2`
2. Check browser console for Chart.js errors
3. Verify bandwidth history data is being received
4. Clear browser cache and reload

### "No active connections" message

**Issue**: Connection table is empty

**Causes**:
1. No network activity currently
2. Backend doesn't have permissions to see connections
3. Backend filtering out listening sockets

**Solution**: Run backend with sudo to see all connections:
```bash
cd backend
sudo python main.py
```

## Development Tips

### Hot Reloading

Next.js dev server supports hot reloading. Changes to components will update instantly without losing state.

### Type Checking

Run TypeScript compiler to check for type errors:
```bash
npx tsc --noEmit
```

### Component Testing

To test a component in isolation, create a test page:
```tsx
// app/test/page.tsx
import { StatsCards } from '@/components/StatsCards';

export default function TestPage() {
  return <StatsCards stats={{ ... }} />;
}
```

## Future Enhancements

Ideas for extending the frontend:

- **Filters**: Filter connections by process, state, protocol
- **Search**: Search by IP address or port
- **Export**: Export data to CSV/JSON
- **Dark Mode Toggle**: Manual dark mode switch
- **Per-Process Charts**: Bandwidth by application
- **Alerts**: Visual/audio alerts for bandwidth thresholds
- **History View**: View past monitoring sessions
- **Settings Panel**: Customize update intervals, chart options

## Performance

The frontend is optimized for performance:
- Efficient WebSocket updates
- Memoized sorted connections
- Chart animations limited to 300ms
- Component-level code splitting
- Image optimization (Next.js built-in)

**Typical Resource Usage:**
- RAM: ~100MB
- CPU: <2% (idle), ~5% (active updates)
- Network: Minimal (WebSocket only)

## Browser Support

Tested and working on:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

WebSocket and modern JavaScript required.

## License

Part of the Network Monitor project.
