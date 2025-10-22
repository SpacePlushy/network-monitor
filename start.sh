#!/bin/bash

# Network Monitor Startup Script
# Starts backend with sudo and frontend

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  Network Monitor Startup${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Request sudo password upfront for packet capture
echo -e "${YELLOW}Requesting sudo access for packet capture...${NC}"
sudo -v

# Keep sudo alive in background
while true; do sudo -n true; sleep 50; kill -0 "$$" || exit; done 2>/dev/null &

echo ""

# Check if backend virtual environment exists
if [ ! -d "$BACKEND_DIR/venv" ]; then
    echo -e "${RED}Error: Backend virtual environment not found!${NC}"
    echo -e "${YELLOW}Please run: cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt${NC}"
    exit 1
fi

# Check if frontend node_modules exists
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo -e "${RED}Error: Frontend dependencies not installed!${NC}"
    echo -e "${YELLOW}Please run: cd frontend && npm install${NC}"
    exit 1
fi

# Kill any existing processes on the ports
echo -e "${YELLOW}Checking for existing processes...${NC}"
# Use sudo for port 5000 since backend runs as root
lsof -ti:5000 | xargs sudo kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Wait for ports to be freed (dynamic check)
CLEANUP_TIMEOUT=10
CLEANUP_ELAPSED=0
while sudo lsof -i:5000 > /dev/null 2>&1 || lsof -i:3000 > /dev/null 2>&1; do
    if [ $CLEANUP_ELAPSED -ge $CLEANUP_TIMEOUT ]; then
        echo -e "${YELLOW}Warning: Ports may still be in use${NC}"
        break
    fi
    sleep 0.2
    CLEANUP_ELAPSED=$((CLEANUP_ELAPSED + 1))
done

echo ""
echo -e "${GREEN}Starting Backend (with sudo)...${NC}"
echo -e "${BLUE}Backend will run on http://127.0.0.1:5000${NC}"
echo -e "${YELLOW}Packet capture enabled for per-connection bandwidth tracking${NC}"
echo ""

# Start backend with sudo (nohup keeps it alive)
cd "$BACKEND_DIR"
nohup sudo bash -c "source venv/bin/activate && python main.py" > backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start (dynamic check)
echo -e "${YELLOW}Waiting for backend to start...${NC}"
BACKEND_TIMEOUT=30
BACKEND_ELAPSED=0
while ! sudo lsof -i:5000 > /dev/null 2>&1; do
    if [ $BACKEND_ELAPSED -ge $BACKEND_TIMEOUT ]; then
        echo -e "${RED}Failed to start backend after ${BACKEND_TIMEOUT}s!${NC}"
        echo -e "${YELLOW}Check backend.log for errors${NC}"
        exit 1
    fi
    sleep 0.5
    BACKEND_ELAPSED=$((BACKEND_ELAPSED + 1))
done

echo -e "${GREEN}✓ Backend started successfully${NC}"
echo ""

echo -e "${GREEN}Starting Frontend...${NC}"
echo -e "${BLUE}Frontend will run on http://localhost:3000${NC}"
echo ""

# Start frontend
cd "$FRONTEND_DIR"
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start (dynamic check)
echo -e "${YELLOW}Waiting for frontend to start...${NC}"
FRONTEND_TIMEOUT=60
FRONTEND_ELAPSED=0
while ! lsof -i:3000 > /dev/null 2>&1; do
    if [ $FRONTEND_ELAPSED -ge $FRONTEND_TIMEOUT ]; then
        echo -e "${RED}Failed to start frontend after ${FRONTEND_TIMEOUT}s!${NC}"
        echo -e "${YELLOW}Check frontend.log for errors${NC}"
        sudo kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 0.5
    FRONTEND_ELAPSED=$((FRONTEND_ELAPSED + 1))
done

echo -e "${GREEN}✓ Frontend started successfully${NC}"
echo ""

echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}✓ Network Monitor is running!${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo -e "Backend:  ${BLUE}http://127.0.0.1:5000${NC}"
echo -e "Frontend: ${BLUE}http://localhost:3000${NC}"
echo -e "API Docs: ${BLUE}http://127.0.0.1:5000/docs${NC}"
echo ""
echo -e "${YELLOW}Logs:${NC}"
echo -e "  Backend:  tail -f $BACKEND_DIR/backend.log"
echo -e "  Frontend: tail -f $FRONTEND_DIR/frontend.log"
echo ""
echo -e "${YELLOW}To stop:${NC}"
echo -e "  Run: ./stop.sh"
echo -e "  Or manually: sudo kill $BACKEND_PID && kill $FRONTEND_PID"
echo ""
# Save PIDs to file for stop script
echo "$BACKEND_PID" > "$SCRIPT_DIR/.backend.pid"
echo "$FRONTEND_PID" > "$SCRIPT_DIR/.frontend.pid"

echo -e "${GREEN}Opening browser...${NC}"
# Open browser (macOS)
open http://localhost:3000 2>/dev/null || echo -e "${YELLOW}Open http://localhost:3000 in your browser${NC}"

echo ""
echo -e "${GREEN}Press Ctrl+C to view logs, or run ./stop.sh to stop the servers${NC}"
echo ""

# Tail logs (will run until Ctrl+C)
tail -f "$BACKEND_DIR/backend.log" "$FRONTEND_DIR/frontend.log"
