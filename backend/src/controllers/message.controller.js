import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import mongoose from "mongoose";
import { logger } from "../lib/logger.js";
import { encryptMessagePayload, decryptMessagePayload } from "../lib/messageEncryption.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const users = await User.find({ _id: { $ne: loggedInUserId } }).select("-password").lean();

    const unreadCounts = await Message.aggregate([
      {
        $match: {
          receiverId: loggedInUserId,
          status: { $ne: "read" }
        }
      },
      {
        $group: {
          _id: "$senderId",
          count: { $sum: 1 }
        }
      }
    ]);

    const unreadMap = {};
    unreadCounts.forEach(item => {
      unreadMap[item._id.toString()] = item.count;
    });

    const filteredUsers = users.map(user => ({
      ...user,
      unreadCount: unreadMap[user._id.toString()] || 0
    }));

    res.status(200).json(filteredUsers);
  } catch (error) {
    logger.error("Error in getUsersForSidebar: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(userToChatId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Mark messages as read when opening conversation
    const result = await Message.updateMany(
      { senderId: userToChatId, receiverId: myId, status: { $ne: "read" } },
      { $set: { status: "read" } }
    );

    if (result.modifiedCount > 0) {
      const senderSocketId = getReceiverSocketId(userToChatId);
      if (senderSocketId.length > 0) {
        io.to(senderSocketId).emit("messagesMarkedAsRead", myId);
      }
    }

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 }).lean();

    const decryptedMessages = messages.map(msg => {
      let result = { ...msg };
      
      if (msg.ciphertext && msg.iv && msg.authTag) {
        try {
          const plaintext = decryptMessagePayload(msg.ciphertext, msg.iv, msg.authTag, msg.keyVersion);
          const parsed = JSON.parse(plaintext);
          result.text = parsed.text;
          result.image = parsed.image;
          result.video = parsed.video;
        } catch (error) {
          logger.warn(`Failed to decrypt message ${msg._id}`);
          result.text = "⚠️ This message is unavailable.";
          result.image = null;
          result.video = null;
        }
      }
      
      // Strip metadata before sending to frontend
      delete result.ciphertext;
      delete result.iv;
      delete result.authTag;
      delete result.keyVersion;

      return result;
    });

    res.status(200).json(decryptedMessages);
  } catch (error) {
    logger.error("Error in getMessages controller: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ error: "Invalid receiver ID" });
    }

    let imageUrl;
    if (image) {
      if (typeof image !== 'string' || !image.startsWith('data:image/')) {
        return res.status(400).json({ error: "Invalid image format" });
      }
      // Check size, approx 5MB limit
      if (image.length > 7 * 1024 * 1024) {
        return res.status(400).json({ error: "Image size must be less than 5MB" });
      }
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const receiverSocketId = getReceiverSocketId(receiverId);
    const initialStatus = "sent";

    // Encrypt the payload before storing
    const payload = JSON.stringify({ text, image: imageUrl });
    const { ciphertext, iv, authTag, keyVersion } = encryptMessagePayload(payload);

    const newMessage = new Message({
      senderId,
      receiverId,
      ciphertext,
      iv,
      authTag,
      keyVersion,
      status: initialStatus,
      // Do not store plain text/image
    });

    await newMessage.save();

    const emittedMessage = newMessage.toObject();
    emittedMessage.text = text;
    emittedMessage.image = imageUrl;
    delete emittedMessage.ciphertext;
    delete emittedMessage.iv;
    delete emittedMessage.authTag;
    delete emittedMessage.keyVersion;

    if (receiverSocketId.length > 0) {
      io.to(receiverSocketId).emit("newMessage", emittedMessage);
    }

    res.status(201).json(emittedMessage);
  } catch (error) {
    logger.error("Error in sendMessage controller: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
