import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

export const authMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('Authentication token missing'));
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('Server misconfiguration: JWT_SECRET missing');
    }

    // Verify token using the shared secret
    const decoded = jwt.verify(token, secret) as any;

    if (!decoded.vendorId || !decoded.userId) {
      return next(new Error('Invalid token payload'));
    }

    // Attach verified tenant and user data to the socket
    socket.data.userId = decoded.userId;
    socket.data.vendorId = decoded.vendorId;
    socket.data.role = decoded.role;

    next();
  } catch (error) {
    return next(new Error('Invalid or expired token'));
  }
};
