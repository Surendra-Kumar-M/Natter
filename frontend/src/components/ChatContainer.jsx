import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";
import { Check, CheckCheck } from "lucide-react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const formatMessageDate = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "TODAY";
  if (date.toDateString() === yesterday.toDateString()) return "YESTERDAY";
  
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  }).toUpperCase();
};

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    typingUsers,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingUsers]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-base-200/30">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  let lastDateStr = null;
  const isTyping = typingUsers.includes(selectedUser._id);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-base-200/50">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-6 flex flex-col relative">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
            <div className="size-16 bg-base-300 rounded-full flex items-center justify-center">
              <span className="text-2xl">💬</span>
            </div>
            <p>No messages yet.<br/>Start the conversation!</p>
          </div>
        )}

        {messages.map((message, index) => {
          const isSent = message.senderId === authUser._id;
          const currentDateStr = formatMessageDate(message.createdAt);
          const showDateSeparator = currentDateStr !== lastDateStr;
          lastDateStr = currentDateStr;

          return (
            <div key={message._id} className="flex flex-col">
              {showDateSeparator && (
                <div className="flex justify-center my-4">
                  <span className="bg-base-300/80 text-base-content/70 text-xs px-3 py-1 rounded-full shadow-sm font-medium">
                    {currentDateStr}
                  </span>
                </div>
              )}
              
              <div className={`chat ${isSent ? "chat-end" : "chat-start"} mb-2`}>
                {!isSent && (
                  <div className="chat-image avatar hidden sm:block">
                    <div className="size-8 rounded-full">
                      <img src={selectedUser.profilePic || "/avatar.png"} alt="avatar" />
                    </div>
                  </div>
                )}
                
                <div 
                  className={`chat-bubble flex flex-col p-2 px-3 relative max-w-[85%] sm:max-w-[75%] 
                  ${isSent ? "bg-primary text-primary-content" : "bg-base-100 text-base-content shadow-sm"}`}
                  style={{ minWidth: "120px" }}
                >
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Attachment"
                      className="w-full max-w-[280px] rounded-lg mb-1 object-cover"
                    />
                  )}
                  {message.text && (
                    <p className="break-words text-[15px] leading-snug mb-3">
                      {message.text}
                    </p>
                  )}
                  
                  {/* Timestamp & Status embedded inside bubble */}
                  <div className={`flex items-center gap-1 text-[11px] absolute bottom-1 right-2 
                    ${isSent ? "text-primary-content/80" : "text-base-content/60"}`}>
                    <span>{formatMessageTime(message.createdAt)}</span>
                    {isSent && (
                      <span className="flex items-center -mr-0.5">
                        {message.status === "sent" && <Check className="size-3.5" />}
                        {message.status === "delivered" && <CheckCheck className="size-3.5" />}
                        {message.status === "read" && <CheckCheck className="size-3.5 text-blue-300" />}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="chat chat-start">
            <div className="chat-image avatar hidden sm:block">
              <div className="size-8 rounded-full">
                <img src={selectedUser.profilePic || "/avatar.png"} alt="avatar" />
              </div>
            </div>
            <div className="chat-bubble bg-base-100 shadow-sm flex items-center p-3 h-10">
              <div className="flex gap-1 items-center opacity-70">
                <div className="w-1.5 h-1.5 bg-base-content rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-1.5 h-1.5 bg-base-content rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-1.5 h-1.5 bg-base-content rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messageEndRef} className="h-2" />
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;
