import { Search, MoreVertical, ArrowLeft } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  return (
    <div className="p-3 border-b border-base-300 bg-base-100 flex items-center justify-between shadow-sm z-10">
      <div className="flex items-center gap-3 min-w-0">
        {/* Back button (Mobile only) */}
        <button aria-label="Close chat" onClick={() => setSelectedUser(null)} className="sm:hidden btn btn-ghost btn-sm btn-circle flex-shrink-0">
          <ArrowLeft className="size-5" />
        </button>
        
        {/* Avatar */}
        <div className="avatar flex-shrink-0">
          <div className="size-10 rounded-full relative">
            <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
          </div>
        </div>

        {/* User info */}
        <div className="flex flex-col min-w-0">
          <h3 className="font-semibold text-base truncate">{selectedUser.fullName}</h3>
          <p className="text-xs text-base-content/60 truncate">
            {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0 text-base-content/60">
        <button aria-label="Search in chat" className="hidden sm:flex btn btn-ghost btn-sm btn-circle">
          <Search className="size-5" />
        </button>
        <button aria-label="More options" onClick={() => setSelectedUser(null)} className="btn btn-ghost btn-sm btn-circle">
          <MoreVertical className="size-5" />
        </button>
      </div>
    </div>
  );
};
export default ChatHeader;
