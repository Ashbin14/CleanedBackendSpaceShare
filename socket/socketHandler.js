import jwt from 'jsonwebtoken';
import User from '../models/user.js';

export const setupSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(socket.user._id.toString());

    socket.on('typing', (data) => {
      socket.to(data.receiverId).emit('userTyping', {
        userId: socket.user._id,
        typing: data.typing
      });
    });

    socket.on('disconnect', () => {

    });
  });
};
