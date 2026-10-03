import { useChatStore } from "../store/useChatStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center sm:pt-20 sm:px-4 pt-16 px-0">
        <div className="bg-base-100 sm:rounded-lg shadow-cl w-full max-w-6xl h-[calc(100dvh-4rem)] sm:h-[calc(100vh-8rem)]">
          <div className="flex h-full sm:rounded-lg overflow-hidden">
            <Sidebar />

            <div className={`${!selectedUser ? "hidden sm:flex" : "flex"} flex-1 flex-col`}>
              {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;
