import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Legacy fields (for plaintext messages before encryption migration)
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    video:{
      type: String,
    },
    // Application-level encryption fields
    ciphertext: {
      type: String,
    },
    iv: {
      type: String,
    },
    authTag: {
      type: String,
    },
    keyVersion: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
  },
  { timestamps: true }
);

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });
messageSchema.index({ receiverId: 1, status: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
