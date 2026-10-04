import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  typingUsers: [],
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser } = get();
    const authUser = useAuthStore.getState().authUser;
    
    // Create an optimistic message
    const tempId = "temp_" + Date.now();
    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      createdAt: new Date().toISOString(),
      status: "sent"
    };

    set((state) => ({ messages: [...state.messages, optimisticMessage] }));

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      const serverMessage = res.data;
      
      set((state) => {
        const exists = state.messages.some((m) => m._id === serverMessage._id);
        if (exists) {
          // If socket or fetch somehow delivered it already, remove temp and update real
          return {
            messages: state.messages
              .filter((m) => m._id !== tempId)
              .map((m) => m._id === serverMessage._id ? serverMessage : m)
          };
        }
        
        // Reconcile optimistic message
        return {
          messages: state.messages.map((m) => m._id === tempId ? serverMessage : m)
        };
      });
    } catch (error) {
      // Revert optimistic message
      set((state) => ({
        messages: state.messages.filter((m) => m._id !== tempId)
      }));
      toast.error(error.response?.data?.message || error.message);
    }
  },

  updateUser: (userId, data) => {
    set({
      users: get().users.map(user => 
        user._id === userId ? { ...user, ...data } : user
      )
    });
  },

  clearTypingUser: (userId) => {
    set({ typingUsers: get().typingUsers.filter(id => id !== userId) });
  },

  markMessagesAsDeliveredForUser: (userId) => {
    set({
      messages: get().messages.map(msg => 
        (msg.receiverId === userId && msg.status === "sent") 
          ? { ...msg, status: "delivered" } 
          : msg
      )
    });
  },

  listenToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    
    socket.off("newMessage");
    socket.off("messagesMarkedAsRead");
    socket.off("message:delivered");

    socket.on("newMessage", (newMessage) => {
      console.log("SOCKET: newMessage received", newMessage._id);
      const authUser = useAuthStore.getState().authUser;
      
      // Prevent sender from processing their own message again via socket
      if (newMessage.senderId === authUser._id) return;
      
      socket.emit("message:delivered", { messageId: newMessage._id, senderId: newMessage.senderId });
      
      const { selectedUser, users } = get();
      const isMessageSentFromSelectedUser = selectedUser && newMessage.senderId === selectedUser._id;
      
      if (isMessageSentFromSelectedUser) {
        socket.emit("markMessagesAsRead", { senderId: selectedUser._id });
        set((state) => {
          const exists = state.messages.some((m) => m._id === newMessage._id);
          if (exists) return state; // Avoid duplicate
          return { messages: [...state.messages, newMessage] };
        });
      } else {
        set({
          users: users.map(user => 
            user._id === newMessage.senderId 
              ? { ...user, unreadCount: (user.unreadCount || 0) + 1 }
              : user
          )
        });
      }
    });

    socket.on("messagesMarkedAsRead", (readerId) => {
      console.log("SOCKET: messagesMarkedAsRead from", readerId);
      const { selectedUser, messages } = get();
      if (selectedUser && readerId === selectedUser._id) {
        set({
          messages: messages.map(msg => 
            msg.receiverId === readerId && msg.status !== "read" 
              ? { ...msg, status: "read" } 
              : msg
          )
        });
      }
    });

    socket.on("message:delivered", ({ messageId }) => {
      set({
        messages: get().messages.map(msg => 
          msg._id === messageId && msg.status === "sent"
            ? { ...msg, status: "delivered" }
            : msg
        )
      });
    });
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.off("typing:start");
    socket.off("typing:stop");

    socket.on("typing:start", (userId) => {
      if (userId !== selectedUser._id) return;
      set({ typingUsers: [...new Set([...get().typingUsers, userId])] });
    });

    socket.on("typing:stop", (userId) => {
      if (userId !== selectedUser._id) return;
      set({ typingUsers: get().typingUsers.filter((id) => id !== userId) });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("typing:start");
    socket.off("typing:stop");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
