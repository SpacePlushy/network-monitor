#!/bin/bash

# Network Monitor Stop Script
# Stops backend and frontend processes

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  Stopping Network Monitor${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Read PIDs from file
if [ -f "$SCRIPT_DIR/.backend.pid" ]; then
    BACKEND_PID=$(cat "$SCRIPT_DIR/.backend.pid")
    echo -e "${YELLOW}Stopping backend (PID: $BACKEND_PID)...${NC}"
    sudo kill $BACKEND_PID 2>/dev/null && echo -e "${GREEN}✓ Backend stopped${NC}" || echo -e "${YELLOW}Backend process not found${NC}"
    rm "$SCRIPT_DIR/.backend.pid"
else
    echo -e "${YELLOW}No backend PID file found${NC}"
fi

if [ -f "$SCRIPT_DIR/.frontend.pid" ]; then
    FRONTEND_PID=$(cat "$SCRIPT_DIR/.frontend.pid")
    echo -e "${YELLOW}Stopping frontend (PID: $FRONTEND_PID)...${NC}"
    kill $FRONTEND_PID 2>/dev/null && echo -e "${GREEN}✓ Frontend stopped${NC}" || echo -e "${YELLOW}Frontend process not found${NC}"
    rm "$SCRIPT_DIR/.frontend.pid"
else
    echo -e "${YELLOW}No frontend PID file found${NC}"
fi

# Also kill any processes on the ports as backup
echo ""
echo -e "${YELLOW}Cleaning up ports 5000 and 3000...${NC}"
lsof -ti:5000 | xargs sudo kill -9 2>/dev/null && echo -e "${GREEN}✓ Port 5000 cleaned${NC}" || echo -e "${BLUE}Port 5000 already free${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo -e "${GREEN}✓ Port 3000 cleaned${NC}" || echo -e "${BLUE}Port 3000 already free${NC}"

echo ""
echo -e "${GREEN}Network Monitor stopped successfully!${NC}"
echo ""
