
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

let socket = null;

// Connect using the logged-in user's JWT
export const connectSocket = (token) => {
    if (!token) return null;

    if (socket) {
        socket.disconnect();
    }

    socket = io(SOCKET_URL, {
        auth: { token },
        autoConnect: true
    });

    return socket;
};

// Access the current socket connection
export const getSocket = () => socket;

// Disconnect when the user logs out
export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
