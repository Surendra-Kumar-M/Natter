import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Search, X, MessageSquare } from "lucide-react";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers } = useAuthStore();
  
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = users.filter((user) => 
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className={`h-full border-r border-base-300 flex flex-col transition-all duration-200
      ${selectedUser ? "hidden sm:flex" : "flex"} w-full sm:w-72 lg:w-80
    `}>
      <div className="p-4 border-b border-base-300 w-full space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Chats</h2>
        </div>
        
        {/* Search input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="size-4 text-base-content/40" />
          </div>
          <input
            type="text"
            placeholder="Search conversations..."
            className="input input-sm input-bordered w-full pl-9 pr-9 bg-base-200 focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="absolute inset-y-0 right-0 pr-2 flex items-center text-base-content/40 hover:text-base-content"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-y-auto w-full py-2">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 opacity-60">
            <div className="size-12 bg-base-200 rounded-full flex items-center justify-center mb-3">
              <MessageSquare className="size-6 text-base-content/50" />
            </div>
            <p className="text-sm">No conversations yet</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center text-sm text-base-content/60 py-10">
            No matches found
          </div>
        ) : (
          filteredUsers.map((user) => (
            <button
              key={user._id}
              onClick={() => {
                setSelectedUser(user);
                if (user.unreadCount > 0) {
                  useChatStore.getState().updateUser(user._id, { unreadCount: 0 });
                }
              }}
              className={`
                w-full p-3 flex items-center gap-3
                hover:bg-base-200 transition-colors
                ${selectedUser?._id === user._id ? "bg-base-200" : ""}
              `}
            >
              <div className="relative mx-auto sm:mx-0 flex-shrink-0">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.fullName}
                  className="size-12 object-cover rounded-full"
                />
                {onlineUsers.includes(user._id) && (
                  <span
                    className="absolute bottom-0 right-0 size-3 bg-emerald-500 
                    rounded-full ring-2 ring-base-100"
                  />
                )}
              </div>

              <div className="flex flex-col flex-1 min-w-0 text-left">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-medium truncate text-sm">{user.fullName}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <p className="text-sm text-base-content/60 truncate pr-2">
                    {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                  </p>
                  
                  {user.unreadCount > 0 && (
                    <span className="flex items-center justify-center bg-primary text-primary-content text-[10px] font-bold size-5 rounded-full flex-shrink-0">
                      {user.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
};
export default Sidebar;
