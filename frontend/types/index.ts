/**
 * TypeScript types for network monitor application
 */

export interface Connection {
  id: string;
  local_addr: string;
  remote_addr: string;
  protocol: string;
  state: string;
  process_name: string;
  pid: number;
  upload_speed: number;
  download_speed: number;
  duration: number;
}

export interface Stats {
  total_upload_speed: number;
  total_download_speed: number;
  active_connections: number;
  total_bytes_sent: number;
  total_bytes_received: number;
  uptime: number;
}

export interface NetworkData {
  connections: Connection[];
  stats: Stats;
}

export interface WebSocketMessage {
  type: 'initial' | 'update' | 'pong';
  data?: NetworkData;
}
