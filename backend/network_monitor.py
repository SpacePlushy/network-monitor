"""
Network monitoring module using psutil to collect connection and bandwidth data.
Uses macOS nettop for per-process bandwidth tracking.
"""

import time
import psutil
import subprocess
import re
from collections import deque
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from datetime import datetime


@dataclass
class Connection:
    """Represents a network connection."""
    id: str
    local_addr: str
    remote_addr: str
    protocol: str
    state: str
    process_name: str
    pid: int
    upload_speed: float  # bytes per second
    download_speed: float  # bytes per second
    duration: float  # seconds
    bytes_sent: int
    bytes_received: int

    def to_dict(self):
        return asdict(self)


@dataclass
class BandwidthPoint:
    """Single point in bandwidth history."""
    timestamp: float
    upload: float  # bytes per second
    download: float  # bytes per second

    def to_dict(self):
        return asdict(self)


class NetworkMonitor:
    """Monitor network connections and bandwidth usage."""

    def __init__(self, history_length: int = 60):
        self.history_length = history_length
        self.bandwidth_history: deque = deque(maxlen=history_length)
        self.connections: Dict[str, dict] = {}
        self.previous_io_counters = None
        self.previous_time = None
        self.start_time = time.time()
        self.total_bytes_sent = 0
        self.total_bytes_received = 0

        # Per-process bandwidth from nettop
        self.process_bandwidth: Dict[int, Dict[str, float]] = {}
        self.previous_process_counters: Dict[int, Dict[str, float]] = {}
        self.previous_nettop_time = None

        # Initialize network counters
        self._update_io_counters()

    def _update_io_counters(self):
        """Update network I/O counters for speed calculation."""
        current_counters = psutil.net_io_counters()
        current_time = time.time()

        if self.previous_io_counters is not None and self.previous_time is not None:
            time_delta = current_time - self.previous_time
            if time_delta > 0:
                bytes_sent_delta = current_counters.bytes_sent - self.previous_io_counters.bytes_sent
                bytes_recv_delta = current_counters.bytes_recv - self.previous_io_counters.bytes_recv

                upload_speed = bytes_sent_delta / time_delta
                download_speed = bytes_recv_delta / time_delta

                # Add to bandwidth history
                point = BandwidthPoint(
                    timestamp=current_time,
                    upload=upload_speed,
                    download=download_speed
                )
                self.bandwidth_history.append(point)

        self.previous_io_counters = current_counters
        self.previous_time = current_time
        self.total_bytes_sent = current_counters.bytes_sent
        self.total_bytes_received = current_counters.bytes_recv

    def _get_connection_id(self, conn) -> str:
        """Generate unique ID for a connection."""
        local = f"{conn.laddr.ip}:{conn.laddr.port}" if conn.laddr else "unknown"
        remote = f"{conn.raddr.ip}:{conn.raddr.port}" if conn.raddr else "unknown"
        return f"{conn.type.name}_{local}_{remote}_{conn.pid}"

    def _get_process_name(self, pid: Optional[int]) -> str:
        """Get process name from PID."""
        if pid is None:
            return "Unknown"
        try:
            process = psutil.Process(pid)
            return process.name()
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            return "Unknown"

    def _format_addr(self, addr) -> str:
        """Format address tuple to string."""
        if addr:
            return f"{addr.ip}:{addr.port}"
        return "N/A"

    def _update_process_bandwidth(self):
        """Update per-process bandwidth using nettop (macOS)."""
        try:
            current_time = time.time()

            # Run nettop with -P flag for one sample, -L 1 for one iteration
            # -J bytes_in,bytes_out to get specific columns
            result = subprocess.run(
                ['nettop', '-P', '-L', '1', '-J', 'bytes_in,bytes_out', '-x'],
                capture_output=True,
                text=True,
                timeout=2
            )

            if result.returncode != 0:
                return

            # Parse nettop output to get current counters
            # Format: process.pid,bytes_in,bytes_out
            current_counters = {}

            for line in result.stdout.strip().split('\n'):
                # Skip header and empty lines
                if not line or line.startswith(',bytes_in') or '===' in line:
                    continue

                # Parse line: processname.pid,bytes_in,bytes_out
                parts = line.split(',')
                if len(parts) >= 3:
                    try:
                        # Extract PID from process.pid format
                        proc_info = parts[0].strip()
                        if '.' in proc_info:
                            pid = int(proc_info.split('.')[-1])
                            bytes_in = float(parts[1].strip() or 0)
                            bytes_out = float(parts[2].strip() or 0)

                            current_counters[pid] = {
                                'bytes_in': bytes_in,
                                'bytes_out': bytes_out
                            }
                    except (ValueError, IndexError):
                        continue

            # Calculate rates from deltas
            if self.previous_process_counters and self.previous_nettop_time is not None:
                time_delta = current_time - self.previous_nettop_time

                if time_delta > 0:
                    process_bandwidth = {}

                    for pid, current in current_counters.items():
                        if pid in self.previous_process_counters:
                            previous = self.previous_process_counters[pid]

                            # Calculate deltas
                            bytes_in_delta = current['bytes_in'] - previous['bytes_in']
                            bytes_out_delta = current['bytes_out'] - previous['bytes_out']

                            # Avoid negative deltas (can happen if process restarted)
                            bytes_in_delta = max(0, bytes_in_delta)
                            bytes_out_delta = max(0, bytes_out_delta)

                            # Calculate rates (bytes per second)
                            process_bandwidth[pid] = {
                                'download': bytes_in_delta / time_delta,
                                'upload': bytes_out_delta / time_delta
                            }

                    self.process_bandwidth = process_bandwidth

            # Store current values for next iteration
            self.previous_process_counters = current_counters
            self.previous_nettop_time = current_time

        except (subprocess.TimeoutExpired, FileNotFoundError, Exception) as e:
            # nettop not available or failed, keep existing data
            pass

    def update(self) -> Dict:
        """
        Update network statistics and return current state.
        Returns dict with connections and stats.
        """
        # Update I/O counters for bandwidth calculation
        self._update_io_counters()

        # Update per-process bandwidth from nettop
        self._update_process_bandwidth()

        # Get all network connections
        current_connections = {}
        try:
            connections_list = psutil.net_connections(kind='inet')
        except (psutil.AccessDenied, PermissionError) as e:
            # Need elevated permissions to access all connections
            # Continue with empty list for now
            connections_list = []

        for conn in connections_list:
            # Skip connections without remote address (listening sockets)
            if not conn.raddr:
                continue

            conn_id = self._get_connection_id(conn)
            process_name = self._get_process_name(conn.pid)

            # Get per-process bandwidth from nettop
            pid = conn.pid if conn.pid else 0
            proc_bw = self.process_bandwidth.get(pid, {'upload': 0, 'download': 0})

            # Check if this is an existing connection
            if conn_id in self.connections:
                # Update existing connection
                existing = self.connections[conn_id]
                duration = time.time() - existing['start_time']

                current_connections[conn_id] = {
                    'id': conn_id,
                    'local_addr': self._format_addr(conn.laddr),
                    'remote_addr': self._format_addr(conn.raddr),
                    'protocol': conn.type.name,
                    'state': conn.status,
                    'process_name': process_name,
                    'pid': pid,
                    'upload_speed': proc_bw['upload'],
                    'download_speed': proc_bw['download'],
                    'duration': duration,
                    'bytes_sent': 0,
                    'bytes_received': 0,
                    'start_time': existing['start_time']
                }
            else:
                # New connection
                current_connections[conn_id] = {
                    'id': conn_id,
                    'local_addr': self._format_addr(conn.laddr),
                    'remote_addr': self._format_addr(conn.raddr),
                    'protocol': conn.type.name,
                    'state': conn.status,
                    'process_name': process_name,
                    'pid': pid,
                    'upload_speed': proc_bw['upload'],
                    'download_speed': proc_bw['download'],
                    'duration': 0,
                    'bytes_sent': 0,
                    'bytes_received': 0,
                    'start_time': time.time()
                }

        # Update stored connections
        self.connections = current_connections

        # Calculate total bandwidth from all processes (sum of per-process bandwidth from nettop)
        current_upload = sum(bw['upload'] for bw in self.process_bandwidth.values())
        current_download = sum(bw['download'] for bw in self.process_bandwidth.values())

        return {
            'connections': list(self.connections.values()),
            'stats': {
                'total_upload_speed': current_upload,
                'total_download_speed': current_download,
                'active_connections': len(self.connections),
                'total_bytes_sent': self.total_bytes_sent,
                'total_bytes_received': self.total_bytes_received,
                'uptime': time.time() - self.start_time
            }
        }

    def get_connections(self) -> List[dict]:
        """Get list of active connections."""
        return list(self.connections.values())

    def get_stats(self) -> dict:
        """Get overall bandwidth statistics."""
        # Calculate total bandwidth from all processes (sum of per-process bandwidth from nettop)
        current_upload = sum(bw['upload'] for bw in self.process_bandwidth.values())
        current_download = sum(bw['download'] for bw in self.process_bandwidth.values())

        return {
            'total_upload_speed': current_upload,
            'total_download_speed': current_download,
            'active_connections': len(self.connections),
            'total_bytes_sent': self.total_bytes_sent,
            'total_bytes_received': self.total_bytes_received,
            'uptime': time.time() - self.start_time
        }

    def get_bandwidth_history(self) -> List[dict]:
        """Get bandwidth history."""
        return [point.to_dict() for point in self.bandwidth_history]
