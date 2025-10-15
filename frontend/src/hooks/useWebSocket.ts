import { useEffect, useCallback } from 'react';
import { websocketService } from '../services/websocket';

export const useWebSocket = () => {
  useEffect(() => {
    websocketService.connect();

    return () => {
      websocketService.disconnect();
    };
  }, []);

  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    websocketService.on(event, callback);

    return () => {
      websocketService.off(event, callback);
    };
  }, []);

  const send = useCallback((data: any) => {
    websocketService.send(data);
  }, []);

  const isConnected = useCallback(() => {
    return websocketService.isConnected();
  }, []);

  return {
    subscribe,
    send,
    isConnected,
  };
};