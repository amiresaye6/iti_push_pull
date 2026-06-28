import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children, userId }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!userId) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect to backend server. Vite proxy covers /api, but socket.io is on port 5000.
    const socketUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin;
    
    console.log(`Connecting socket to: ${socketUrl} with userId: ${userId}`);
    
    const newSocket = io(socketUrl, {
      query: { userId },
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    return () => {
      console.log('Disconnecting socket due to unmount/user logout...');
      newSocket.disconnect();
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
export default SocketContext;
