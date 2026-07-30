import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';

const SocketContext = createContext(null);
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const { currentUser, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [lastNotification, setLastNotification] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return undefined;
    }

    let socket;
    let cancelled = false;

    (async () => {
      const token = await currentUser.getIdToken();
      if (cancelled) return;

      socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });
      socketRef.current = socket;

      socket.on('notification', (notification) => {
        setLastNotification(notification);
        setUnreadCount((c) => c + 1);
        showToast(notification.message, 'info');
      });

      socket.on('connect_error', (err) => {
        console.warn('[socket] connection error:', err.message);
      });
    })();

    return () => {
      cancelled = true;
      socket?.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, currentUser?.uid]);

  const clearUnread = () => setUnreadCount(0);

  return (
    <SocketContext.Provider value={{ lastNotification, unreadCount, clearUnread, setUnreadCount }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within a SocketProvider');
  return ctx;
}
