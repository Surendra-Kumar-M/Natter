import { Server } from "socket.io";
import http from "http";
import express from "express";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { logger } from "./logger.js";
import jwt from "jsonwebtoken";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [process.env.CLIENT_URL || "http://localhost:5173"],
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

io.use((socket, next) => {
  const cookieHeader = socket.handshake.headers.cookie;
  if (!cookieHeader) return next(new Error("Authentication error"));
  
  const token = cookieHeader.split(';').find(c => c.trim().startsWith('jwt='))?.split('=')[1];
  if (!token) return next(new Error("Authentication error"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  logger.info("A user connected", { socketId: socket.id });

  const userId = socket.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    io.emit("user:online", userId);
    
    // Mark pending messages as delivered
    Message.updateMany(
      { receiverId: userId, status: "sent" },
      { $set: { status: "delivered" } }
    ).catch(err => logger.error("Error marking messages delivered", err));
  }

  // Backward compatibility
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("markMessagesAsRead", async ({ senderId }) => {
    try {
      const result = await Message.updateMany(
        { senderId, receiverId: userId, status: { $ne: "read" } },
        { $set: { status: "read" } }
      );
      if (result.modifiedCount > 0) {
        const senderSocketId = getReceiverSocketId(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("messagesMarkedAsRead", userId);
        }
      }
    } catch (error) {
      console.error(error);
    }
  });

  socket.on("message:delivered", async ({ messageId, senderId }) => {
    try {
      await Message.findByIdAndUpdate(messageId, { status: "delivered" });
      const senderSocketId = getReceiverSocketId(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("message:delivered", { messageId });
      }
    } catch (error) {
      console.error(error);
    }
  });

  socket.on("typing:start", (receiverId) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing:start", userId);
    }
  });

  socket.on("typing:stop", (receiverId) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing:stop", userId);
    }
  });

  socket.on("disconnect", async () => {
    logger.info("A user disconnected", { socketId: socket.id });
    delete userSocketMap[userId];
    
    const lastSeen = new Date();
    io.emit("user:offline", { userId, lastSeen });
    // Backward compatibility
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    
    if (userId) {
      try {
        await User.findByIdAndUpdate(userId, { lastSeen });
      } catch (error) {
        logger.error("Error updating lastSeen", error);
      }
    }
  });
});

export { io, app, server };
