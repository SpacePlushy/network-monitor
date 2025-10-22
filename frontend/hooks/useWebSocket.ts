'use client';

import { useEffect, useRef, useState } from 'react';
import { getWebSocketURL } from '@/lib/api';
import type { WebSocketMessage, NetworkData } from '@/types';

interface UseWebSocketOptions {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseWebSocketReturn {
  data: NetworkData | null;
  isConnected: boolean;
  error: string | null;
  reconnectAttempts: number;
  sendMessage: (message: any) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
  } = options;

  const [data, setData] = useState<NetworkData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const connect = () => {
      // Don't connect if component unmounted
      if (!isMountedRef.current) return;

      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      try {
        const ws = new WebSocket(getWebSocketURL());

        ws.onopen = () => {
          if (!isMountedRef.current) return;
          console.log('WebSocket connected');
          setIsConnected(true);
          setError(null);
          reconnectAttemptsRef.current = 0;
          setReconnectAttempts(0);
        };

        ws.onmessage = (event) => {
          if (!isMountedRef.current) return;
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            if (message.type === 'initial' || message.type === 'update') {
              if (message.data) {
                setData(message.data);
              }
            }
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err);
          }
        };

        ws.onerror = (event) => {
          if (!isMountedRef.current) return;
          console.error('WebSocket error');
          setError('WebSocket connection error');
        };

        ws.onclose = () => {
          if (!isMountedRef.current) return;
          console.log('WebSocket disconnected');
          setIsConnected(false);

          // Attempt to reconnect
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current += 1;
            setReconnectAttempts(reconnectAttemptsRef.current);
            console.log(`Reconnecting in ${reconnectInterval}ms... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);

            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, reconnectInterval);
          } else {
            setError(`Failed to reconnect after ${maxReconnectAttempts} attempts`);
          }
        };

        wsRef.current = ws;
      } catch (err) {
        console.error('Failed to create WebSocket:', err);
        setError('Failed to create WebSocket connection');
      }
    };

    // Initial connection
    connect();

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [reconnectInterval, maxReconnectAttempts]); // Only reconnect config in dependencies

  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Cannot send message.');
    }
  };

  return {
    data,
    isConnected,
    error,
    reconnectAttempts,
    sendMessage,
  };
}
