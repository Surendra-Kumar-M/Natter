import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Paperclip, Send, Loader2, Smile } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { compressImage } from "../lib/utils";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { sendMessage, selectedUser } = useChatStore();
  const { socket } = useAuthStore();

  const handleInputChange = (e) => {
    setText(e.target.value);

    if (socket && selectedUser) {
      socket.emit("typing:start", selectedUser._id);
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing:stop", selectedUser._id);
      }, 2000);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result);
      setImagePreview(compressed);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    if (isSending) return;

    setIsSending(true);

    const messageData = {
      text: text.trim(),
      image: imagePreview,
    };

    try {
      await sendMessage(messageData);
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-3 w-full bg-base-100/50">
      {imagePreview && (
        <div className="mb-3 mx-2 p-3 bg-base-100 rounded-xl border border-base-300 shadow-sm relative max-w-sm">
          <h3 className="text-sm font-medium mb-2 text-base-content/80">Image Preview</h3>
          <div className="relative rounded-lg overflow-hidden border border-base-200 mb-3 bg-base-200">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-h-48 w-full object-contain"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={removeImage} className="btn btn-sm btn-ghost" disabled={isSending}>
              Cancel
            </button>
            <button type="button" onClick={handleSendMessage} className="btn btn-sm btn-primary" disabled={isSending}>
              {isSending ? <Loader2 className="size-4 animate-spin" /> : "Send"}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-base-100 p-1.5 rounded-full border border-base-300 shadow-sm mx-1">
        <button
          type="button"
          aria-label="Attach image"
          className={`btn btn-circle btn-sm btn-ghost shrink-0
                   ${imagePreview ? "text-primary" : "text-base-content/60"}`}
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
        >
          <Paperclip className="size-5" />
        </button>
        
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageChange}
        />

        <input
          type="text"
          data-testid="chat-input"
          className="flex-1 bg-transparent border-none focus:outline-none px-2 text-[15px]"
          placeholder="Type a message..."
          value={text}
          onChange={handleInputChange}
          disabled={isSending}
        />

        <button
          type="button"
          aria-label="Emoji"
          className="hidden sm:flex btn btn-circle btn-sm btn-ghost shrink-0 text-base-content/50"
          disabled={true} // Disabled for now as per instructions
        >
          <Smile className="size-5" />
        </button>

        <button
          type="submit"
          data-testid="send-message"
          aria-label="Send message"
          className="btn btn-sm btn-circle btn-primary shrink-0 ml-1"
          disabled={(!text.trim() && !imagePreview) || isSending}
        >
          {isSending && !imagePreview ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4 -ml-0.5" />
          )}
        </button>
      </form>
    </div>
  );
};
export default MessageInput;
